// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Test} from "forge-std/Test.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {CurrencyLibrary, Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {StateLibrary} from "@uniswap/v4-core/src/libraries/StateLibrary.sol";
import {LiquidityAmounts} from "@uniswap/v4-core/test/utils/LiquidityAmounts.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {Constants} from "@uniswap/v4-core/test/utils/Constants.sol";

import {EasyPosm} from "./utils/libraries/EasyPosm.sol";
import {BaseTest} from "./utils/BaseTest.sol";
import {ReactiveDeltaShieldHook} from "../src/ReactiveDeltaShieldHook.sol";
import {MockPerpDex} from "./utils/MockPerpDex.sol";

contract ReactiveDeltaShieldHookTest is BaseTest {
    using EasyPosm for IPositionManager;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;
    using StateLibrary for IPoolManager;

    Currency currency0;
    Currency currency1;
    PoolKey poolKey;
    PoolId poolId;

    ReactiveDeltaShieldHook hook;
    MockPerpDex mockDex;

    address constant REACTIVE_VM = address(0x90);
    address constant COLLATERAL_VAULT = address(0x99);

    uint256 tokenId;
    int24 tickLower;
    int24 tickUpper;

    function setUp() public {
        deployArtifactsAndLabel();
        (currency0, currency1) = deployCurrencyPair();

        mockDex = new MockPerpDex();

        // Calculate the address for the hook based on flags
        // Only AFTER_SWAP_FLAG is required for this hook
        address hookAddress = address(
            uint160(Hooks.AFTER_SWAP_FLAG) ^ (0x5555 << 144)
        );

        bytes memory constructorArgs = abi.encode(
            poolManager,
            REACTIVE_VM,
            address(mockDex),
            COLLATERAL_VAULT
        );

        deployCodeTo("ReactiveDeltaShieldHook.sol:ReactiveDeltaShieldHook", constructorArgs, hookAddress);
        hook = ReactiveDeltaShieldHook(hookAddress);

        // Initialize the pool
        poolKey = PoolKey(currency0, currency1, 3000, 60, IHooks(hook));
        poolId = poolKey.toId();
        poolManager.initialize(poolKey, Constants.SQRT_PRICE_1_1);

        // Provide liquidity
        tickLower = TickMath.minUsableTick(poolKey.tickSpacing);
        tickUpper = TickMath.maxUsableTick(poolKey.tickSpacing);

        uint128 liquidityAmount = 100e18;
        (uint256 amount0Expected, uint256 amount1Expected) = LiquidityAmounts.getAmountsForLiquidity(
            Constants.SQRT_PRICE_1_1,
            TickMath.getSqrtPriceAtTick(tickLower),
            TickMath.getSqrtPriceAtTick(tickUpper),
            liquidityAmount
        );

        (tokenId,) = positionManager.mint(
            poolKey,
            tickLower,
            tickUpper,
            liquidityAmount,
            amount0Expected + 1,
            amount1Expected + 1,
            address(this),
            block.timestamp,
            Constants.ZERO_BYTES
        );
    }

    function testFeeAccumulationOnSwap() public {
        uint256 initialCollateral = hook.hedgeCollateral(poolId);
        assertEq(initialCollateral, 0);

        // Perform a swap to generate fees
        uint256 amountIn = 10e18;
        swapRouter.swapExactTokensForTokens({
            amountIn: amountIn,
            amountOutMin: 0,
            zeroForOne: true,
            poolKey: poolKey,
            hookData: Constants.ZERO_BYTES,
            receiver: address(this),
            deadline: block.timestamp + 1
        });

        uint256 newCollateral = hook.hedgeCollateral(poolId);
        // HEDGE_FEE_FRACTION is 10% of swap fees (in basis points = 1000/100000)
        // 10e18 * 1000 / 100000 = 1e17 = 0.1e18
        assertEq(newCollateral, 1e17);
    }

    function testExecuteHedgeFromReactiveVM() public {
        // First swap to accumulate collateral
        uint256 amountIn = 10e18;
        swapRouter.swapExactTokensForTokens({
            amountIn: amountIn,
            amountOutMin: 0,
            zeroForOne: true,
            poolKey: poolKey,
            hookData: Constants.ZERO_BYTES,
            receiver: address(this),
            deadline: block.timestamp + 1
        });

        uint256 marginAmount = hook.hedgeCollateral(poolId);
        assertEq(marginAmount, 1e17);

        // Trigger executeHedge from mock Reactive VM
        vm.prank(REACTIVE_VM);
        hook.executeHedge(poolId, Currency.unwrap(currency0), true);

        bytes32 activePositionId = hook.activeHedges(poolId);
        assertTrue(activePositionId != bytes32(0));
        assertEq(hook.hedgeCollateral(poolId), 0); // Margin was sent to GMX / PerpDex

        // Verify dex state
        (address asset, bool isShort, uint256 dexMargin, uint256 leverage, bool active) = mockDex.positions(activePositionId);
        assertEq(asset, Currency.unwrap(currency0));
        assertTrue(isShort);
        assertEq(dexMargin, marginAmount);
        assertEq(leverage, 5);
        assertTrue(active);
    }

    function testCloseHedgeFromReactiveVM() public {
        // Accumulate collateral
        swapRouter.swapExactTokensForTokens({
            amountIn: 10e18,
            amountOutMin: 0,
            zeroForOne: true,
            poolKey: poolKey,
            hookData: Constants.ZERO_BYTES,
            receiver: address(this),
            deadline: block.timestamp + 1
        });

        // Open hedge
        vm.prank(REACTIVE_VM);
        hook.executeHedge(poolId, Currency.unwrap(currency0), true);

        bytes32 activePositionId = hook.activeHedges(poolId);

        // Close hedge
        vm.prank(REACTIVE_VM);
        hook.closeHedge(poolId);

        // Verify active hedge was cleared
        assertEq(hook.activeHedges(poolId), bytes32(0));

        // Verify collateral payout returned to hook collateral (110% of 1e17 = 1.1e17)
        uint256 finalCollateral = hook.hedgeCollateral(poolId);
        assertEq(finalCollateral, 11e16);
    }

    function testRevertHedgeUnauthorized() public {
        // Attempt to execute hedge from unauthorized user
        vm.expectRevert("Only Reactive VM authorized");
        hook.executeHedge(poolId, Currency.unwrap(currency0), true);
    }
}

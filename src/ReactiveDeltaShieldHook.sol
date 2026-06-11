// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@openzeppelin/uniswap-hooks/src/base/BaseHook.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager, SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";

interface IPerpDex {
    function openPosition(
        address asset,
        bool isShort,
        uint256 marginAmount,
        uint256 leverage
    ) external returns (bytes32 positionId);

    function closePosition(bytes32 positionId) external returns (uint256 payoutAmount);
}

contract ReactiveDeltaShieldHook is BaseHook {
    error OnlyReactiveVM();
    error ActiveHedgeExists();
    error NoCollateralAccumulated();
    error NoActiveHedgeToClose();
    error OnlyOwner();
    error HookPaused();
    error InvalidFeeFraction();
    error InvalidLeverage();

    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    
    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
address public reactiveVmAddress;
    address public perpDex;
    address public marginVault;

    uint24 public hedgeFeeFraction = 1000; // 10% of swap fees (in basis points)
    uint256 public leverage = 5; // 5x leverage on GMX/PerpDex

    mapping(PoolId => bytes32) public activeHedges;
    mapping(PoolId => uint256) public hedgeCollateral;

    event HedgeOpened(PoolId indexed poolId, bytes32 positionId, bool isShort, uint256 marginAmount);
    event HedgeClosed(PoolId indexed poolId, bytes32 positionId, uint256 payoutAmount);
    event FeeAccumulated(PoolId indexed poolId, uint256 amount);

    modifier onlyReactiveVM() {
        if (msg.sender != reactiveVmAddress) revert OnlyReactiveVM();
        _;
    }

    constructor(
        IPoolManager _poolManager,
        address _reactiveVmAddress,
        address _perpDex,
        address _marginVault
    ) BaseHook(_poolManager) {
        owner = msg.sender;
        reactiveVmAddress = _reactiveVmAddress;
        perpDex = _perpDex;
        marginVault = _marginVault;
    }

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true, // Listen to afterSwap to capture fee portions
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    function _afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        PoolId poolId = key.toId();
        
        // Calculate the fee portion from the swap volume
        // In Uniswap v4, delta.amount0() and delta.amount1() represent the net pool balance changes.
        // Positive delta means the user sent tokens to the pool (inflow).
        // Negative delta means the pool sent tokens to the user (outflow).
        int128 amount0 = delta.amount0();
        uint256 swapAmount = amount0 > 0 ? uint256(int256(amount0)) : uint256(int256(-amount0));
        
        // Dynamic dynamic fee allocation
        uint256 allocatedFee = (swapAmount * hedgeFeeFraction) / 100000;
        
        if (allocatedFee > 0) {
            hedgeCollateral[poolId] += allocatedFee;
            emit FeeAccumulated(poolId, allocatedFee);
        }

        return (BaseHook.afterSwap.selector, 0);
    }

    /**
     * @notice Callback invoked by the Reactive VM when delta drift exceeds safety threshold.
     * @param poolId The ID of the pool triggering the callback.
     * @param asset The address of the asset being hedged.
     * @param isShort Direction of the hedge (true for shorting, false for long).
     */
    function executeHedge(
        PoolId poolId,
        address asset,
        bool isShort
    ) external onlyReactiveVM {
        if (activeHedges[poolId] != bytes32(0)) revert ActiveHedgeExists();
        
        uint256 marginAmount = hedgeCollateral[poolId];
        if (marginAmount == 0) revert NoCollateralAccumulated();

        // Reset local accumulator for GMX deposit
        hedgeCollateral[poolId] = 0;

        // Open position on Mock Perp Dex
        bytes32 positionId = IPerpDex(perpDex).openPosition(
            asset,
            isShort,
            marginAmount,
            leverage
        );

        activeHedges[poolId] = positionId;

        emit HedgeOpened(poolId, positionId, isShort, marginAmount);
    }

    /**
     * @notice Callback invoked by the Reactive VM when pool price stabilizes or LP rebalances.
     * @param poolId The ID of the pool triggering the callback.
     */
    function closeHedge(PoolId poolId) external onlyReactiveVM {
        bytes32 positionId = activeHedges[poolId];
        if (positionId == bytes32(0)) revert NoActiveHedgeToClose();

        // Close position on Mock Perp Dex
        uint256 payoutAmount = IPerpDex(perpDex).closePosition(positionId);

        // Reset active hedge state
        activeHedges[poolId] = bytes32(0);
        
        // Return payout back to the collateral vault / LPs
        hedgeCollateral[poolId] += payoutAmount;

        emit HedgeClosed(poolId, positionId, payoutAmount);
    }

    event ReactiveVmAddressUpdated(address indexed oldAddress, address indexed newAddress);

    function updateReactiveVmAddress(address _newReactiveVmAddress) external onlyOwner {
        emit ReactiveVmAddressUpdated(reactiveVmAddress, _newReactiveVmAddress);
        reactiveVmAddress = _newReactiveVmAddress;
    }

    event PerpDexAddressUpdated(address indexed oldAddress, address indexed newAddress);

    function updatePerpDexAddress(address _newPerpDex) external onlyOwner {
        emit PerpDexAddressUpdated(perpDex, _newPerpDex);
        perpDex = _newPerpDex;
    }
}

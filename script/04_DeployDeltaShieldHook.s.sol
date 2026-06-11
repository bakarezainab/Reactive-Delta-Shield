// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {BaseScript} from "./base/BaseScript.sol";
import {ReactiveDeltaShieldHook} from "../src/ReactiveDeltaShieldHook.sol";

contract DeployDeltaShieldHookScript is BaseScript {
    function run() public {
        uint160 flags = uint160(Hooks.AFTER_SWAP_FLAG);

        address reactiveVmAddress = address(0x90);
        address perpDex = address(0x91);
        address marginVault = address(0x92);

        bytes memory constructorArgs = abi.encode(
            poolManager,
            reactiveVmAddress,
            perpDex,
            marginVault
        );

        (address hookAddress, bytes32 salt) =
            HookMiner.find(CREATE2_FACTORY, flags, type(ReactiveDeltaShieldHook).creationCode, constructorArgs);

        vm.startBroadcast();
        ReactiveDeltaShieldHook hook = new ReactiveDeltaShieldHook{salt: salt}(
            IPoolManager(poolManager),
            reactiveVmAddress,
            perpDex,
            marginVault
        );
        vm.stopBroadcast();

        require(address(hook) == hookAddress, "DeployDeltaShieldHookScript: Hook Address Mismatch");
    }
}

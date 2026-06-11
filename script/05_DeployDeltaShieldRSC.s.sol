// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseScript} from "./base/BaseScript.sol";
import {DeltaShieldRSC} from "../src/DeltaShieldRSC.sol";

contract DeployDeltaShieldRSCScript is BaseScript {
    function run() public {
        address service = address(0x100); // Reactive System Contract address
        uint256 sourceChainId = 11155111; // Sepolia
        uint256 targetChainId = 11155111;
        address uniswapPoolAddress = address(0x200);
        address hookAddress = address(0x300);

        vm.startBroadcast();
        new DeltaShieldRSC(
            service,
            sourceChainId,
            targetChainId,
            uniswapPoolAddress,
            hookAddress
        );
        vm.stopBroadcast();
    }
}

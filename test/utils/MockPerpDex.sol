// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPerpDex} from "../../src/ReactiveDeltaShieldHook.sol";

contract MockPerpDex is IPerpDex {
    event PositionOpened(bytes32 indexed positionId, address indexed asset, bool isShort, uint256 marginAmount, uint256 leverage);
    event PositionClosed(bytes32 indexed positionId, uint256 payoutAmount);

    struct Position {
        address asset;
        bool isShort;
        uint256 marginAmount;
        uint256 leverage;
        bool active;
    }

    mapping(bytes32 => Position) public positions;
    uint256 public positionNonce;

    function openPosition(
        address asset,
        bool isShort,
        uint256 marginAmount,
        uint256 leverage
    ) external override returns (bytes32 positionId) {
        positionId = keccak256(abi.encodePacked(asset, isShort, marginAmount, leverage, positionNonce++));
        positions[positionId] = Position({
            asset: asset,
            isShort: isShort,
            marginAmount: marginAmount,
            leverage: leverage,
            active: true
        });
        emit PositionOpened(positionId, asset, isShort, marginAmount, leverage);
    }

    function closePosition(bytes32 positionId) external override returns (uint256 payoutAmount) {
        Position storage pos = positions[positionId];
        require(pos.active, "Position not active");
        pos.active = false;
        
        // Return 110% of margin (simulating a profitable hedge)
        payoutAmount = (pos.marginAmount * 110) / 100;
        emit PositionClosed(positionId, payoutAmount);
    }
}

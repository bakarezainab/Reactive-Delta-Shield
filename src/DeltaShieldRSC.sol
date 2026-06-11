// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

struct LogRecord {
    uint256 chain_id;
    address _contract;
    uint256 topic_0;
    uint256 topic_1;
    uint256 topic_2;
    uint256 topic_3;
    bytes data;
    uint256 block_number;
    uint256 op_code;
    uint256 block_hash;
    uint256 tx_hash;
    uint256 log_index;
}

interface IReactive {
    function react(LogRecord calldata log) external;
}

interface ISystemContract {
    function subscribe(
        uint256 chainId,
        address contractAddress,
        uint256 topic0,
        uint256 topic1,
        uint256 topic2,
        uint256 topic3
    ) external;
}

abstract contract AbstractReactive is IReactive {
    ISystemContract public immutable service;
    bool public immutable vm;

    modifier vmOnly() {
        require(vm, "VM only");
        _;
    }

    modifier rnOnly() {
        require(!vm, "RN only");
        _;
    }

    constructor(address _service) {
        service = ISystemContract(_service);
        // Detect execution environment (simplified for compilation)
        vm = (msg.sender == address(0));
    }
}

contract DeltaShieldRSC is AbstractReactive {
    // Event signature of the destination chain's callback emission
    event Callback(
        uint256 indexed chainId,
        address indexed target,
        uint64 gasLimit,
        bytes payload
    );

    // Uniswap v4 Swap Event signature topic
    // Swap(bytes32 indexed poolId, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)
    uint256 public constant SWAP_EVENT_TOPIC = uint256(keccak256("Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)"));
    uint256 public constant REACTIVE_IGNORE = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;

    uint256 public immutable sourceChainId;
    uint256 public immutable targetChainId;
    address public immutable uniswapPoolAddress;
    address public immutable hookAddress;

    // Running calculations for Volatility/Deviation
    int24 public lastTick;
    uint256 public accumulatedTickDev;
    uint256 public constant VOLATILITY_THRESHOLD = 50; // Threshold of tick variance

    constructor(
        address _service,
        uint256 _sourceChainId,
        uint256 _targetChainId,
        address _uniswapPoolAddress,
        address _hookAddress
    ) AbstractReactive(_service) {
        sourceChainId = _sourceChainId;
        targetChainId = _targetChainId;
        uniswapPoolAddress = _uniswapPoolAddress;
        hookAddress = _hookAddress;

        // Subscribe to Swap events of the Uniswap Pool on the source chain
        service.subscribe(
            sourceChainId,
            uniswapPoolAddress,
            SWAP_EVENT_TOPIC,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE,
            REACTIVE_IGNORE
        );
    }

    function react(LogRecord calldata log) external override vmOnly {
        if (log.topic_0 == SWAP_EVENT_TOPIC) {
            bytes32 poolId = bytes32(log.topic_1);
            
            // Unpack Swap parameters from data
            // Swap event layout has unindexed fields: (int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)
            (, , , , int24 currentTick, ) = abi.decode(
                log.data,
                (int128, int128, uint160, uint128, int24, uint24)
            );

            if (lastTick == 0) {
                lastTick = currentTick;
                return;
            }

            // Simple delta calculation
            int24 tickDiff = currentTick > lastTick ? currentTick - lastTick : lastTick - currentTick;
            
            if (uint24(tickDiff) > VOLATILITY_THRESHOLD) {
                // Determine direction: if tick goes up, hedge asset 1, else hedge asset 0
                bool isShort = currentTick > lastTick;
                
                // Construct callback payload for the destination hook contract: executeHedge(PoolId, address, bool)
                bytes memory payload = abi.encodeWithSignature(
                    "executeHedge(bytes32,address,bool)",
                    poolId,
                    log._contract,
                    isShort
                );

                // Trigger callback execution on target chain
                emit Callback(targetChainId, hookAddress, 500000, payload);
            } else {
                // If price returns to baseline or volatility is low, close the hedge
                bytes memory closePayload = abi.encodeWithSignature(
                    "closeHedge(bytes32)",
                    poolId
                );
                
                emit Callback(targetChainId, hookAddress, 300000, closePayload);
            }

            lastTick = currentTick;
        }
    }
}

import os
import subprocess
import sys

def run_cmd(args, cwd=None):
    res = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Command failed: {' '.join(args)}")
        print(f"STDOUT:\n{res.stdout}")
        print(f"STDERR:\n{res.stderr}")
        raise RuntimeError(f"Command failed with code {res.returncode}")
    return res.stdout

def check_compile():
    try:
        run_cmd(["forge", "test"])
        return True
    except RuntimeError:
        return False

# Initialize git status/user if not set
try:
    run_cmd(["git", "config", "user.name", "bakarezainab"])
    run_cmd(["git", "config", "user.email", "bakarezainab@users.noreply.github.com"])
except Exception as e:
    print("Failed to set git config", e)

# We want 20 distinct commits. We will apply them one by one.
# Let's define the steps:

hook_path = "src/ReactiveDeltaShieldHook.sol"
test_path = "test/ReactiveDeltaShieldHook.t.sol"
rsc_path = "src/DeltaShieldRSC.sol"
dex_path = "test/utils/MockPerpDex.sol"

def commit(msg):
    run_cmd(["git", "add", "-A"])
    run_cmd(["git", "commit", "-m", msg])
    print(f"COMMITTED: {msg}")

# --- COMMIT 1 ---
# Add custom errors definition to ReactiveDeltaShieldHook.sol
print("--- Commit 1 ---")
with open(hook_path, "r") as f:
    content = f.read()

errors_str = """
    error OnlyReactiveVM();
    error ActiveHedgeExists();
    error NoCollateralAccumulated();
    error NoActiveHedgeToClose();
    error OnlyOwner();
    error HookPaused();
    error InvalidFeeFraction();
    error InvalidLeverage();
"""

insert_pos = content.find("contract ReactiveDeltaShieldHook is BaseHook {")
if insert_pos == -1:
    raise ValueError("Could not find contract definition")
insert_pos = content.find("{", insert_pos) + 1

content = content[:insert_pos] + errors_str + content[insert_pos:]
with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 1")
    sys.exit(1)
commit("refactor: add custom errors to ReactiveDeltaShieldHook")


# --- COMMIT 2 ---
# Replace require with custom error for onlyReactiveVM modifier
print("--- Commit 2 ---")
with open(hook_path, "r") as f:
    content = f.read()

old_mod = """    modifier onlyReactiveVM() {
        require(msg.sender == reactiveVmAddress, "Only Reactive VM authorized");
        _;
    }"""
new_mod = """    modifier onlyReactiveVM() {
        if (msg.sender != reactiveVmAddress) revert OnlyReactiveVM();
        _;
    }"""
if old_mod not in content:
    content = content.replace('require(msg.sender == reactiveVmAddress, "Only Reactive VM authorized");', 'if (msg.sender != reactiveVmAddress) revert OnlyReactiveVM();')
else:
    content = content.replace(old_mod, new_mod)

with open(hook_path, "w") as f:
    f.write(content)

# Update test expectation
with open(test_path, "r") as f:
    test_content = f.read()
test_content = test_content.replace('vm.expectRevert("Only Reactive VM authorized");', 'vm.expectRevert(ReactiveDeltaShieldHook.OnlyReactiveVM.selector);')
with open(test_path, "w") as f:
    f.write(test_content)

if not check_compile():
    print("Compile failed on Step 2")
    sys.exit(1)
commit("refactor: use custom error in onlyReactiveVM modifier and update tests")


# --- COMMIT 3 ---
# Replace require with custom errors in executeHedge and closeHedge
print("--- Commit 3 ---")
with open(hook_path, "r") as f:
    content = f.read()

content = content.replace('require(activeHedges[poolId] == bytes32(0), "Active hedge already exists");', 'if (activeHedges[poolId] != bytes32(0)) revert ActiveHedgeExists();')
content = content.replace('require(marginAmount > 0, "No collateral accumulated for hedging");', 'if (marginAmount == 0) revert NoCollateralAccumulated();')
content = content.replace('require(positionId != bytes32(0), "No active hedge to close");', 'if (positionId == bytes32(0)) revert NoActiveHedgeToClose();')

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 3")
    sys.exit(1)
commit("refactor: replace remaining requires with custom errors in hedge logic")


# --- COMMIT 4 ---
# Add events to MockPerpDex
print("--- Commit 4 ---")
with open(dex_path, "r") as f:
    content = f.read()

dex_events = """
    event PositionOpened(bytes32 indexed positionId, address indexed asset, bool isShort, uint256 marginAmount, uint256 leverage);
    event PositionClosed(bytes32 indexed positionId, uint256 payoutAmount);
"""
insert_pos = content.find("contract MockPerpDex is IPerpDex {")
insert_pos = content.find("{", insert_pos) + 1
content = content[:insert_pos] + dex_events + content[insert_pos:]

# Emit them
content = content.replace(
    'positions[positionId] = Position({\n            asset: asset,\n            isShort: isShort,\n            marginAmount: marginAmount,\n            leverage: leverage,\n            active: true\n        });',
    'positions[positionId] = Position({\n            asset: asset,\n            isShort: isShort,\n            marginAmount: marginAmount,\n            leverage: leverage,\n            active: true\n        });\n        emit PositionOpened(positionId, asset, isShort, marginAmount, leverage);'
)
content = content.replace(
    'pos.active = false;\n        \n        // Return 110% of margin (simulating a profitable hedge)\n        payoutAmount = (pos.marginAmount * 110) / 100;',
    'pos.active = false;\n        \n        // Return 110% of margin (simulating a profitable hedge)\n        payoutAmount = (pos.marginAmount * 110) / 100;\n        emit PositionClosed(positionId, payoutAmount);'
)

with open(dex_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 4")
    sys.exit(1)
commit("feat: add event emissions to MockPerpDex for position tracking")


# --- COMMIT 5 ---
# Refactor Core Addresses and Configs in ReactiveDeltaShieldHook to be Mutable (for Governance)
print("--- Commit 5 ---")
with open(hook_path, "r") as f:
    content = f.read()

# Make them mutable state variables
content = content.replace("address public immutable reactiveVmAddress;", "address public reactiveVmAddress;")
content = content.replace("address public immutable perpDex;", "address public perpDex;")
content = content.replace("address public immutable marginVault;", "address public marginVault;")
content = content.replace("uint24 public constant HEDGE_FEE_FRACTION = 1000;", "uint24 public hedgeFeeFraction = 1000;")
content = content.replace("uint256 public constant LEVERAGE = 5;", "uint256 public leverage = 5;")

# Replace uppercase in executeHedge
content = content.replace("LEVERAGE", "leverage")
content = content.replace("HEDGE_FEE_FRACTION", "hedgeFeeFraction")

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 5")
    sys.exit(1)
commit("refactor: make core addresses and configurations mutable state variables")


# --- COMMIT 6 ---
# Implement basic ownership pattern in hook contract
print("--- Commit 6 ---")
with open(hook_path, "r") as f:
    content = f.read()

# Add owner variable and modifier
owner_code = """
    address public owner;

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }
"""
insert_pos = content.find("address public reactiveVmAddress;")
content = content[:insert_pos] + owner_code + content[insert_pos:]

# Set owner in constructor
content = content.replace(
    "BaseHook(_poolManager) {\n        reactiveVmAddress = _reactiveVmAddress;\n        perpDex = _perpDex;\n        marginVault = _marginVault;\n    }",
    "BaseHook(_poolManager) {\n        owner = msg.sender;\n        reactiveVmAddress = _reactiveVmAddress;\n        perpDex = _perpDex;\n        marginVault = _marginVault;\n    }"
)

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 6")
    sys.exit(1)
commit("feat: implement basic ownership controls in the hook")


# --- COMMIT 7 ---
# Add function to update Reactive VM address
print("--- Commit 7 ---")
with open(hook_path, "r") as f:
    content = f.read()

gov_fn1 = """
    event ReactiveVmAddressUpdated(address indexed oldAddress, address indexed newAddress);

    function updateReactiveVmAddress(address _newReactiveVmAddress) external onlyOwner {
        emit ReactiveVmAddressUpdated(reactiveVmAddress, _newReactiveVmAddress);
        reactiveVmAddress = _newReactiveVmAddress;
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + gov_fn1 + content[insert_pos:]

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 7")
    sys.exit(1)
commit("feat: add governance function to update Reactive VM address")


# --- COMMIT 8 ---
# Add function to update Perp DEX address
print("--- Commit 8 ---")
with open(hook_path, "r") as f:
    content = f.read()

gov_fn2 = """
    event PerpDexAddressUpdated(address indexed oldAddress, address indexed newAddress);

    function updatePerpDexAddress(address _newPerpDex) external onlyOwner {
        emit PerpDexAddressUpdated(perpDex, _newPerpDex);
        perpDex = _newPerpDex;
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + gov_fn2 + content[insert_pos:]

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 8")
    sys.exit(1)
commit("feat: add governance function to update Perp DEX address")


# --- COMMIT 9 ---
# Add function to update Margin Vault address
print("--- Commit 9 ---")
with open(hook_path, "r") as f:
    content = f.read()

gov_fn3 = """
    event MarginVaultAddressUpdated(address indexed oldAddress, address indexed newAddress);

    function updateMarginVaultAddress(address _newMarginVault) external onlyOwner {
        emit MarginVaultAddressUpdated(marginVault, _newMarginVault);
        marginVault = _newMarginVault;
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + gov_fn3 + content[insert_pos:]

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 9")
    sys.exit(1)
commit("feat: add governance function to update Margin Vault address")


# --- COMMIT 10 ---
# Add function to set hedge fee fraction with validation
print("--- Commit 10 ---")
with open(hook_path, "r") as f:
    content = f.read()

gov_fn4 = """
    event HedgeFeeFractionUpdated(uint24 oldFraction, uint24 newFraction);

    function setHedgeFeeFraction(uint24 _newFraction) external onlyOwner {
        if (_newFraction > 100000) revert InvalidFeeFraction(); // Max 100%
        emit HedgeFeeFractionUpdated(hedgeFeeFraction, _newFraction);
        hedgeFeeFraction = _newFraction;
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + gov_fn4 + content[insert_pos:]

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 10")
    sys.exit(1)
commit("feat: add governance function to set hedge fee fraction with bounds check")


# --- COMMIT 11 ---
# Add function to adjust leverage configuration
print("--- Commit 11 ---")
with open(hook_path, "r") as f:
    content = f.read()

gov_fn5 = """
    event LeverageUpdated(uint256 oldLeverage, uint256 newLeverage);

    function setLeverage(uint256 _newLeverage) external onlyOwner {
        if (_newLeverage == 0 || _newLeverage > 100) revert InvalidLeverage();
        emit LeverageUpdated(leverage, _newLeverage);
        leverage = _newLeverage;
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + gov_fn5 + content[insert_pos:]

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 11")
    sys.exit(1)
commit("feat: add governance function to adjust perpetual leverage configuration")


# --- COMMIT 12 ---
# Add pausable state and modifier to safeguard hook execution
print("--- Commit 12 ---")
with open(hook_path, "r") as f:
    content = f.read()

pause_code = """
    bool public paused;

    event PausedStateUpdated(bool isPaused);

    modifier whenNotPaused() {
        if (paused) revert HookPaused();
        _;
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PausedStateUpdated(_paused);
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + pause_code + content[insert_pos:]

# Add whenNotPaused to executeHedge
content = content.replace("external onlyReactiveVM {", "external onlyReactiveVM whenNotPaused {")

with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 12")
    sys.exit(1)
commit("feat: add pausable control flow to halt hedging during emergencies")


# --- COMMIT 13 ---
# Write test cases for governance updates in test file
print("--- Commit 13 ---")
with open(test_path, "r") as f:
    content = f.read()

test_gov = """
    function testGovernanceAddressUpdates() public {
        hook.updateReactiveVmAddress(address(0x11));
        assertEq(hook.reactiveVmAddress(), address(0x11));

        hook.updatePerpDexAddress(address(0x22));
        assertEq(hook.perpDex(), address(0x22));

        hook.updateMarginVaultAddress(address(0x33));
        assertEq(hook.marginVault(), address(0x33));
    }

    function testGovernanceUpdatesRevertForNonOwner() public {
        vm.prank(address(0xdead));
        vm.expectRevert(ReactiveDeltaShieldHook.OnlyOwner.selector);
        hook.updateReactiveVmAddress(address(0x11));
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + test_gov + content[insert_pos:]

with open(test_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 13")
    sys.exit(1)
commit("test: add unit tests for governance address updates")


# --- COMMIT 14 ---
# Add unit tests for fee fraction and leverage changes
print("--- Commit 14 ---")
with open(test_path, "r") as f:
    content = f.read()

test_params = """
    function testGovernanceParamUpdates() public {
        hook.setHedgeFeeFraction(5000); // 5%
        assertEq(hook.hedgeFeeFraction(), 5000);

        hook.setLeverage(10);
        assertEq(hook.leverage(), 10);
    }

    function testGovernanceParamReverts() public {
        vm.expectRevert(ReactiveDeltaShieldHook.InvalidFeeFraction.selector);
        hook.setHedgeFeeFraction(100001); // Exceeds 100%

        vm.expectRevert(ReactiveDeltaShieldHook.InvalidLeverage.selector);
        hook.setLeverage(0);
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + test_params + content[insert_pos:]

with open(test_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 14")
    sys.exit(1)
commit("test: add unit tests for fee fraction and leverage adjustments")


# --- COMMIT 15 ---
# Add unit tests for pause/unpause functionality
print("--- Commit 15 ---")
with open(test_path, "r") as f:
    content = f.read()

test_pause = """
    function testPauseFunctionality() public {
        hook.setPaused(true);
        assertTrue(hook.paused());

        // Swap during pause shouldn't accumulate fees if we update _afterSwap to check pause status
    }
"""
insert_pos = content.rfind("}")
content = content[:insert_pos] + test_pause + content[insert_pos:]

with open(test_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 15")
    sys.exit(1)
commit("test: add unit tests for pause/unpause state assertions")


# --- COMMIT 16 ---
# Gas optimization in _afterSwap: cache fee fraction, skip fee collection if paused
print("--- Commit 16 ---")
with open(hook_path, "r") as f:
    content = f.read()

old_after_swap_body = """        PoolId poolId = key.toId();
        
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

        return (BaseHook.afterSwap.selector, 0);"""

new_after_swap_body = """        if (paused) return (BaseHook.afterSwap.selector, 0);

        PoolId poolId = key.toId();
        int128 amount0 = delta.amount0();
        uint256 swapAmount = amount0 > 0 ? uint256(int256(amount0)) : uint256(int256(-amount0));
        
        // Cache fee fraction to save SLOAD
        uint24 fraction = hedgeFeeFraction;
        uint256 allocatedFee = (swapAmount * fraction) / 100000;
        
        if (allocatedFee > 0) {
            hedgeCollateral[poolId] += allocatedFee;
            emit FeeAccumulated(poolId, allocatedFee);
        }

        return (BaseHook.afterSwap.selector, 0);"""

content = content.replace(old_after_swap_body, new_after_swap_body)
with open(hook_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 16")
    sys.exit(1)
commit("perf: optimize _afterSwap gas usage by caching fee fraction and checking pause state")


# --- COMMIT 17 ---
# Complete the pause test logic using the now updated _afterSwap
print("--- Commit 17 ---")
with open(test_path, "r") as f:
    content = f.read()

old_pause_test = """    function testPauseFunctionality() public {
        hook.setPaused(true);
        assertTrue(hook.paused());

        // Swap during pause shouldn't accumulate fees if we update _afterSwap to check pause status
    }"""

new_pause_test = """    function testPauseFunctionality() public {
        hook.setPaused(true);
        assertTrue(hook.paused());

        // Fee accumulation should be skipped when paused
        uint256 initialCollateral = hook.hedgeCollateral(poolId);
        
        swapRouter.swapExactTokensForTokens({
            amountIn: 10e18,
            amountOutMin: 0,
            zeroForOne: true,
            poolKey: poolKey,
            hookData: Constants.ZERO_BYTES,
            receiver: address(this),
            deadline: block.timestamp + 1
        });
        
        assertEq(hook.hedgeCollateral(poolId), initialCollateral); // No change because paused
        
        // executeHedge should revert when paused
        vm.prank(REACTIVE_VM);
        vm.expectRevert(ReactiveDeltaShieldHook.HookPaused.selector);
        hook.executeHedge(poolId, Currency.unwrap(currency0), true);
    }"""

content = content.replace(old_pause_test, new_pause_test)
with open(test_path, "w") as f:
    f.write(content)

# Fix unused variable in testCloseHedgeFromReactiveVM
with open(test_path, "r") as f:
    content = f.read()
content = content.replace(
    'bytes32 activePositionId = hook.activeHedges(poolId);',
    'bytes32 activePositionId = hook.activeHedges(poolId);\n        assertTrue(activePositionId != bytes32(0));'
)
with open(test_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 17")
    sys.exit(1)
commit("test: verify pause safety reverts and fee skipping logic")


# --- COMMIT 18 ---
# Refactor DeltaShieldRSC.sol to use custom errors instead of require
print("--- Commit 18 ---")
with open(rsc_path, "r") as f:
    content = f.read()

content = content.replace(
    'modifier vmOnly() {\n        require(vm, "VM only");\n        _;\n    }',
    'error OnlyVM();\n\n    modifier vmOnly() {\n        if (!vm) revert OnlyVM();\n        _;\n    }'
)

with open(rsc_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 18")
    sys.exit(1)
commit("refactor: use custom error OnlyVM in DeltaShieldRSC")


# --- COMMIT 19 ---
# Add detailed comments in DeltaShieldRSC.sol
print("--- Commit 19 ---")
with open(rsc_path, "r") as f:
    content = f.read()

docs_comment = """
    // Reactive Network Protocol Specifications:
    // - Subscriptions filter L1 event logs by contract address and topic0.
    // - REACTIVE_IGNORE acts as a wildcard for unindexed/indexed values.
    // - Callback emits specify the destination chainId, target address, and gas limit.
"""
insert_pos = content.find("contract DeltaShieldRSC is AbstractReactive {")
insert_pos = content.find("{", insert_pos) + 1
content = content[:insert_pos] + docs_comment + content[insert_pos:]

with open(rsc_path, "w") as f:
    f.write(content)

if not check_compile():
    print("Compile failed on Step 19")
    sys.exit(1)
commit("docs: add inline documentation for Reactive Network specifications in RSC")


# --- COMMIT 20 ---
# Create Deployment script for Hook
print("--- Commit 20 ---")
script_hook_path = "script/04_DeployDeltaShieldHook.s.sol"
script_hook_code = """// SPDX-License-Identifier: MIT
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
"""

with open(script_hook_path, "w") as f:
    f.write(script_hook_code)

if not check_compile():
    print("Compile failed on Step 20")
    sys.exit(1)
commit("feat: add deployment script for ReactiveDeltaShieldHook")


# --- COMMIT 21 ---
# Create Deployment script for RSC
print("--- Commit 21 ---")
script_rsc_path = "script/05_DeployDeltaShieldRSC.s.sol"
script_rsc_code = """// SPDX-License-Identifier: MIT
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
"""

with open(script_rsc_path, "w") as f:
    f.write(script_rsc_code)

if not check_compile():
    print("Compile failed on Step 21")
    sys.exit(1)
commit("feat: add deployment script for DeltaShieldRSC")


# --- COMMIT 22 ---
# Update README.md
print("--- Commit 22 ---")
with open("README.md", "r") as f:
    readme = f.read()

new_section = """
## Governance & Safety Controls

The `ReactiveDeltaShieldHook` features a set of robust safety controls and governance settings to manage the hedging configuration dynamically:
- **Ownership**: The contract designates an `owner` who is authorized to adjust key configurations and update target addresses.
- **Pausability**: In the event of a market anomaly or smart contract emergency, the owner can pause the hook. When paused, the hook will skip swap fee accumulation and reject new hedging triggers.
- **Updatable Configurations**:
  - `updateReactiveVmAddress`: Update the authorized Reactive VM sender.
  - `updatePerpDexAddress` & `updateMarginVaultAddress`: Migrate to a new derivatives platform or vault.
  - `setHedgeFeeFraction`: Fine-tune the percentage of swap fees allocated to hedging.
  - `setLeverage`: Dynamically adjust perpetual contract leverage bounds (1x - 100x).
"""
readme = readme.replace("## Getting Started", new_section + "\n## Getting Started")

with open("README.md", "w") as f:
    f.write(readme)

if not check_compile():
    print("Compile failed on Step 22")
    sys.exit(1)
commit("docs: update README with governance, safety controls and features description")

print("All commits applied successfully!")

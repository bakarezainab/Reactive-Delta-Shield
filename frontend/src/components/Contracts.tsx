const HOOK_METHODS = [
  { sig: "fn",    name: "_afterSwap()",                       badge: "internal", badgeColor: "text-[#06b6d4] bg-[#06b6d4]/10", desc: "Allocates hedgeFeeFraction of every swap into the collateral vault. Emits FeeAccumulated." },
  { sig: "fn",    name: "executeHedge(poolId, asset, isShort)", badge: "RSC only", badgeColor: "text-[#a78bfa] bg-[#7c3aed]/10", desc: "Called by Reactive VM. Opens a leveraged position on the perp DEX using accumulated collateral." },
  { sig: "fn",    name: "closeHedge(poolId)",                 badge: "RSC only", badgeColor: "text-[#a78bfa] bg-[#7c3aed]/10", desc: "Called by Reactive VM when price stabilises. Closes position and returns payout to the vault." },
  { sig: "fn",    name: "setHedgeFeeFraction(fraction)",       badge: "owner",    badgeColor: "text-[#f59e0b] bg-[#f59e0b]/10", desc: "Owner-only. Adjusts basis-point fee allocation (max 100 000 = 100%)." },
  { sig: "fn",    name: "setLeverage(leverage)",               badge: "owner",    badgeColor: "text-[#f59e0b] bg-[#f59e0b]/10", desc: "Owner-only. Sets leverage for perp positions. Range: 1×–100×." },
  { sig: "fn",    name: "setPaused(bool)",                     badge: "owner",    badgeColor: "text-[#f59e0b] bg-[#f59e0b]/10", desc: "Owner-only. Immediately halts fee accumulation and blocks new hedge triggers." },
];

const RSC_METHODS = [
  { sig: "fn",    name: "react(LogRecord log)",         badge: "vm only",  badgeColor: "text-[#06b6d4] bg-[#06b6d4]/10", desc: "Entry point called by Reactive VM for every subscribed Swap event. Computes tick drift and emits the appropriate callback." },
  { sig: "const", name: "SWAP_EVENT_TOPIC",              badge: "immutable", badgeColor: "text-[#10b981] bg-[#10b981]/10", desc: "keccak256('Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)') — the v4 Swap signature used as subscription filter." },
  { sig: "const", name: "VOLATILITY_THRESHOLD = 50",    badge: "immutable", badgeColor: "text-[#10b981] bg-[#10b981]/10", desc: "Minimum tick deviation to open a hedge. Below this threshold, a closeHedge callback is emitted instead." },
  { sig: "ev",    name: "Callback(chainId, target, gasLimit, payload)", badge: "event", badgeColor: "text-[#ff007a] bg-[#ff007a]/10", desc: "Cross-chain message targeting the hook. Payload is ABI-encoded executeHedge or closeHedge calldata." },
];

function MethodRow({ sig, name, badge, badgeColor, desc }: { sig: string; name: string; badge: string; badgeColor: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 bg-[#080b12] border border-[#1f2d47] rounded-lg p-3.5">
      <span className="font-mono text-[11px] text-[#06b6d4] mt-0.5 flex-shrink-0 w-8">{sig}</span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[13px] text-white mb-1 break-words">{name}</div>
        <div className="text-[12px] text-slate-400 leading-relaxed">{desc}</div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex-shrink-0 mt-0.5 ${badgeColor}`}>
        {badge}
      </span>
    </div>
  );
}

export function Contracts() {
  return (
    <section id="contracts" className="py-24 bg-[#080b12]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-px bg-[#ff007a]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#ff007a]">
            Smart Contracts
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
          Two contracts. One system.
        </h2>
        <p className="text-slate-400 text-base max-w-lg mb-12">
          The hook lives on your target chain. The RSC lives on Reactive Network. They coordinate without any trusted relayer.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hook */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl overflow-hidden">
            <div className="bg-[#1a2235] border-b border-[#1f2d47] p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#ff007a]/12 flex items-center justify-center text-xl flex-shrink-0">🛡️</div>
              <div>
                <div className="font-bold text-[15px] text-white">ReactiveDeltaShieldHook</div>
                <div className="font-mono text-[11px] text-slate-500">src/ReactiveDeltaShieldHook.sol</div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
                The Uniswap v4 Hook contract. Inherits{" "}
                <code className="font-mono text-[#06b6d4] text-[11px]">BaseHook</code> and listens to{" "}
                <code className="font-mono text-[#06b6d4] text-[11px]">afterSwap</code>. Manages the collateral vault, receives callbacks from the Reactive VM, and interfaces with the perpetual DEX.
              </p>
              <div className="flex flex-col gap-2.5">
                {HOOK_METHODS.map((m) => <MethodRow key={m.name} {...m} />)}
              </div>
            </div>
          </div>

          {/* RSC */}
          <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl overflow-hidden">
            <div className="bg-[#1a2235] border-b border-[#1f2d47] p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/12 flex items-center justify-center text-xl flex-shrink-0">⚡</div>
              <div>
                <div className="font-bold text-[15px] text-white">DeltaShieldRSC</div>
                <div className="font-mono text-[11px] text-slate-500">src/DeltaShieldRSC.sol</div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[13px] text-slate-400 leading-relaxed mb-5">
                The Reactive Smart Contract deployed on Reactive Network. Subscribes to Uniswap v4{" "}
                <code className="font-mono text-[#06b6d4] text-[11px]">Swap</code> event logs on the source chain, decodes tick data, and emits{" "}
                <code className="font-mono text-[#06b6d4] text-[11px]">Callback</code> events targeting the hook.
              </p>
              <div className="flex flex-col gap-2.5">
                {RSC_METHODS.map((m) => <MethodRow key={m.name} {...m} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

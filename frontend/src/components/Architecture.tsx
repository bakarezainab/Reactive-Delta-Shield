const NODES = [
  { icon: "🧑‍💻", name: "Trader",          sub: "Executes swap",          tag: "EOA",       tagColor: "text-slate-400 bg-slate-800" },
  { icon: "🏊",   name: "Uniswap v4 Pool", sub: "Emits Swap events",       tag: "v4 Core",   tagColor: "text-[#ff007a] bg-[#ff007a]/10" },
  { icon: "🛡️",   name: "Delta-Shield Hook",sub: "Fee allocation + hedge", tag: "Hook",      tagColor: "text-[#06b6d4] bg-[#06b6d4]/10" },
  { icon: "⚡",   name: "DeltaShield RSC",  sub: "Reactive Network oracle", tag: "RSC",       tagColor: "text-[#a78bfa] bg-[#7c3aed]/10" },
  { icon: "📊",   name: "Perp DEX",         sub: "GMX / Synthetix margin",  tag: "DeFi",      tagColor: "text-[#10b981] bg-[#10b981]/10" },
];

const EVENTS = [
  { name: "FeeAccumulated(poolId, amount)", desc: "Emitted every swap. Tracks running collateral balance per pool." },
  { name: "Callback(chainId, target, gasLimit, payload)", desc: "Emitted by RSC on Reactive Network. Carries executeHedge or closeHedge call data." },
  { name: "HedgeOpened(poolId, positionId, isShort, margin)", desc: "Confirms leveraged position was opened on the perp DEX." },
  { name: "HedgeClosed(poolId, positionId, payout)", desc: "Position closed. Payout returns to hedgeCollateral for reinvestment." },
];

export function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-[#0d1120]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-px bg-[#ff007a]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#ff007a]">
            Architecture
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
          Multi-layer protocol design
        </h2>
        <p className="text-slate-400 text-base max-w-lg mb-12">
          Two contracts across two execution environments, coordinated by Reactive Network's cross-chain messaging layer.
        </p>

        {/* Flow diagram */}
        <div className="bg-[#111827] border border-[#1f2d47] rounded-2xl overflow-hidden mb-6">
          <div className="bg-[#1a2235] border-b border-[#1f2d47] px-5 py-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28ca41]" />
            <span className="ml-2 text-[11px] font-mono text-slate-500">Execution Flow — Reactive Delta-Shield</span>
          </div>

          <div className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-0 overflow-x-auto">
              {NODES.map((node, i) => (
                <div key={node.name} className="flex flex-col md:flex-row items-center">
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-[140px] border border-[#1f2d47] rounded-xl p-4 hover:border-[#ff007a] hover:bg-[#ff007a]/5 transition-all cursor-default mb-3">
                      <div className="text-3xl mb-2">{node.icon}</div>
                      <div className="text-[12px] font-bold text-white uppercase tracking-wide mb-1">
                        {node.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{node.sub}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${node.tagColor}`}>
                      {node.tag}
                    </span>
                  </div>
                  {i < NODES.length - 1 && (
                    <div className="text-slate-600 text-xl md:mx-2 my-2 md:my-0 rotate-90 md:rotate-0">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EVENTS.map((ev) => (
            <div key={ev.name} className="bg-[#111827] border border-[#1f2d47] rounded-xl p-5 hover:border-[#2a3d5e] transition-colors">
              <div className="font-mono text-[12px] text-[#06b6d4] font-bold mb-2">{ev.name}</div>
              <div className="text-[13px] text-slate-400 leading-relaxed">{ev.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

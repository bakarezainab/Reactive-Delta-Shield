const STEPS = [
  {
    num: "01",
    icon: "🔄",
    color: "rgba(255,0,122,0.12)",
    title: "Retail Swap Occurs",
    desc: "A trader executes a large swap pushing the price tick outside the LP's concentrated range.",
  },
  {
    num: "02",
    icon: "🪝",
    color: "rgba(6,182,212,0.1)",
    title: "afterSwap() Fires",
    desc: "The hook intercepts the lifecycle callback and routes a fee fraction into the on-chain Collateral Vault.",
  },
  {
    num: "03",
    icon: "⚡",
    color: "rgba(124,58,237,0.12)",
    title: "RSC Monitors Ticks",
    desc: "DeltaShieldRSC on Reactive Network calculates tick deviation in real-time against the 50-tick threshold.",
  },
  {
    num: "04",
    icon: "📉",
    color: "rgba(16,185,129,0.1)",
    title: "Hedge Triggered",
    desc: "Threshold exceeded → RSC emits cross-chain Callback → hook opens a leveraged short/long on the perp DEX.",
  },
  {
    num: "05",
    icon: "♻️",
    color: "rgba(245,158,11,0.1)",
    title: "Position Closed & Reinvested",
    desc: "When price stabilises, the RSC triggers closeHedge(). Payout returns to the vault and compounds the LP's shield.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 bg-[#0d1120]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-px bg-[#ff007a]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#ff007a]">
            How It Works
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
          Five steps. Fully autonomous.
        </h2>
        <p className="text-slate-400 text-base max-w-lg mb-14">
          From a retail swap to a cross-chain hedge position — all handled without LP intervention.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#1f2d47] rounded-2xl overflow-hidden">
          {STEPS.map((s) => (
            <div
              key={s.num}
              className="bg-[#111827] hover:bg-[#1a2235] transition-colors p-7 group"
            >
              <div className="text-[11px] font-bold tracking-widest text-[#ff007a] mb-4 font-mono">
                {s.num}
              </div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: s.color }}
              >
                {s.icon}
              </div>
              <div className="font-bold text-[15px] text-white mb-2">{s.title}</div>
              <div className="text-slate-400 text-[13px] leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

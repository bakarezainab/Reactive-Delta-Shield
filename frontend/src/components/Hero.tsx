"use client";

import { useAccount } from "wagmi";
import { ArrowRight, GitBranch, Shield } from "lucide-react";

const STATS = [
  { val: "10%", label: "Default Fee Allocation" },
  { val: "5×", label: "Default Leverage" },
  { val: "50", label: "Tick Volatility Threshold" },
  { val: "0", label: "Manual Steps Required" },
];

export function Hero() {
  const { isConnected } = useAccount();

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(124,58,237,0.18)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_60%,rgba(255,0,122,0.08)_0%,transparent_50%)]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(#1f2d47 1px, transparent 1px), linear-gradient(90deg, #1f2d47 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-7 rounded-full bg-[#ff007a]/10 border border-[#ff007a]/25 text-[#ff007a] text-[11px] font-bold tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff007a] animate-pulse" />
          Uniswap v4 Hook · Reactive Network · UHI9
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-6">
          Autonomous LP<br />
          <span className="bg-gradient-to-r from-[#ff007a] via-[#a855f7] to-[#06b6d4] bg-clip-text text-transparent">
            Delta-Hedging Engine
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
          A Uniswap v4 hook that autonomously hedges impermanent loss for concentrated LPs —
          self-funded from swap fees, zero manual intervention required.
        </p>

        <div className="flex flex-wrap gap-3 justify-center">
          <a
            href="#dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#ff007a] hover:opacity-90 text-white font-bold text-[14px] transition-all hover:-translate-y-0.5 shadow-[0_4px_24px_rgba(255,0,122,0.3)]"
          >
            {isConnected ? "Open Dashboard" : "Explore the Hook"}
            <ArrowRight size={15} />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#1f2d47] hover:border-[#ff007a] hover:text-[#ff007a] text-slate-300 font-bold text-[14px] transition-colors"
          >
            <GitBranch size={15} />
            View on GitHub
          </a>
        </div>

        {/* Stats */}
        <div className="mt-16 pt-10 border-t border-[#1f2d47] grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-black tracking-tight text-white mb-1">{s.val}</div>
              <div className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

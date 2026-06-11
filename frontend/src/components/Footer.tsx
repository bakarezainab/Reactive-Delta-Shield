import { Shield } from "lucide-react";

const LINKS = {
  Project: [
    { label: "How It Works", href: "#how" },
    { label: "Dashboard", href: "#dashboard" },
    { label: "Architecture", href: "#architecture" },
    { label: "Contracts", href: "#contracts" },
  ],
  Contracts: [
    { label: "ReactiveDeltaShieldHook.sol", href: "#" },
    { label: "DeltaShieldRSC.sol", href: "#" },
    { label: "MockPerpDex.sol", href: "#" },
  ],
  "Built With": [
    { label: "Uniswap v4", href: "https://docs.uniswap.org/contracts/v4/overview" },
    { label: "Reactive Network", href: "https://reactive.network" },
    { label: "Foundry", href: "https://book.getfoundry.sh" },
    { label: "GMX v2", href: "https://gmx.io" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-[#0d1120] border-t border-[#1f2d47] pt-16 pb-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-wrap gap-12 justify-between mb-12">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5 font-bold text-[16px] mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff007a] to-[#7c3aed] flex items-center justify-center">
                <Shield size={16} className="text-white" />
              </div>
              <span className="text-white">Reactive Delta-Shield</span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Autonomous, self-funding LP delta-hedging engine for Uniswap v4. Built for UHI9 — Impermanent Loss & Yield Systems.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-wrap gap-12">
            {Object.entries(LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
                  {heading}
                </h4>
                <div className="flex flex-col gap-2.5">
                  {links.map((l) => (
                    <a
                      key={l.label}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel={l.href.startsWith("http") ? "noreferrer" : undefined}
                      className="text-[13px] text-slate-400 hover:text-[#ff007a] transition-colors"
                    >
                      {l.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-[#1f2d47] flex flex-wrap items-center justify-between gap-4">
          <p className="text-[12px] text-slate-600">
            MIT License · Reactive Delta-Shield · UHI9 2026
          </p>
          <div className="flex gap-5">
            {["GitHub", "Docs", "LICENSE"].map((l) => (
              <a key={l} href="#" className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

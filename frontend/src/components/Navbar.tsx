"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { arbitrum, base, mainnet } from "wagmi/chains";
import { Shield, ChevronDown, Menu, X, Zap } from "lucide-react";

const CHAINS = [mainnet, arbitrum, base];

const NAV_LINKS = [
  { label: "How It Works", href: "#how" },
  { label: "Dashboard", href: "#dashboard" },
  { label: "Architecture", href: "#architecture" },
  { label: "Contracts", href: "#contracts" },
];

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [showWallets, setShowWallets] = useState(false);
  const [showChains, setShowChains] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentChain = CHAINS.find((c) => c.id === chainId);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1f2d47] bg-[#080b12]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 font-bold text-[15px] tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff007a] to-[#7c3aed] flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
          <span className="text-white hidden sm:block">Reactive Delta-Shield</span>
          <span className="text-white sm:hidden">RDS</span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="px-3 py-1.5 text-[13px] font-medium text-slate-400 hover:text-white hover:bg-[#111827] rounded-md transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Chain switcher */}
          {isConnected && (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowChains(!showChains)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-[#111827] border border-[#1f2d47] rounded-lg text-slate-300 hover:border-[#2a3d5e] transition-colors"
              >
                <Zap size={11} className="text-[#f59e0b]" />
                {currentChain?.name ?? "Unknown"}
                <ChevronDown size={12} />
              </button>
              {showChains && (
                <div className="absolute right-0 top-10 w-40 bg-[#111827] border border-[#1f2d47] rounded-lg py-1 shadow-xl">
                  {CHAINS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { switchChain({ chainId: c.id }); setShowChains(false); }}
                      className={`w-full text-left px-4 py-2 text-[13px] hover:bg-[#1a2235] transition-colors ${c.id === chainId ? "text-[#ff007a] font-semibold" : "text-slate-300"}`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Connect / wallet */}
          {isConnected ? (
            <button
              onClick={() => disconnect()}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-semibold bg-[#111827] border border-[#1f2d47] rounded-lg text-slate-300 hover:border-[#ff007a] hover:text-[#ff007a] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowWallets(!showWallets)}
                className="flex items-center gap-2 px-4 py-1.5 text-[13px] font-bold bg-[#ff007a] hover:opacity-90 text-white rounded-lg transition-opacity"
              >
                Connect Wallet
              </button>
              {showWallets && (
                <div className="absolute right-0 top-10 w-48 bg-[#111827] border border-[#1f2d47] rounded-lg py-1 shadow-xl">
                  {connectors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { connect({ connector: c }); setShowWallets(false); }}
                      className="w-full text-left px-4 py-2.5 text-[13px] text-slate-300 hover:bg-[#1a2235] hover:text-white transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1f2d47] bg-[#080b12] px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-[14px] font-medium text-slate-400 hover:text-white rounded-md"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

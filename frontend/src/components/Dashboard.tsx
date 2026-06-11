"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Settings, Shield, TrendingDown, Wallet, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { HOOK_ABI } from "@/lib/wagmi";

// Placeholder address — replace with deployed contract
const HOOK_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

// Mock chart data simulating collateral vault growth over 30 swaps
const mockCollateralData = Array.from({ length: 30 }, (_, i) => ({
  swap: i + 1,
  collateral: parseFloat((0.002 * i + Math.random() * 0.005).toFixed(4)),
  hedgePnl: parseFloat(((Math.random() - 0.4) * 0.003).toFixed(4)),
}));

const mockHedgeHistory = [
  { id: "0x1a2b…3c4d", type: "SHORT", margin: "0.0041 ETH", status: "Closed", pnl: "+0.0012 ETH" },
  { id: "0x5e6f…7a8b", type: "LONG",  margin: "0.0038 ETH", status: "Open",   pnl: "—"           },
  { id: "0x9c0d…1e2f", type: "SHORT", margin: "0.0029 ETH", status: "Closed", pnl: "-0.0004 ETH" },
  { id: "0x3a4b…5c6d", type: "SHORT", margin: "0.0055 ETH", status: "Closed", pnl: "+0.0021 ETH" },
];

function StatCard({
  icon, label, value, sub, accent = "#ff007a",
}: { icon: React.ReactNode; label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-5 hover:border-[#2a3d5e] transition-colors">
      <div className="flex items-center gap-2 text-slate-400 text-[12px] font-semibold uppercase tracking-wider mb-3">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-black text-white tracking-tight mb-1">{value}</div>
      {sub && <div className="text-[12px] text-slate-500">{sub}</div>}
    </div>
  );
}

function ConfigPanel() {
  const { address } = useAccount();
  const [feeFrac, setFeeFrac] = useState("1000");
  const [leverage, setLeverage] = useState("5");
  const [txStatus, setTxStatus] = useState<"idle" | "pending" | "success" | "error">("idle");

  const { writeContract, data: txHash } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash: txHash });

  const handleSetFee = () => {
    writeContract({
      address: HOOK_ADDRESS,
      abi: HOOK_ABI,
      functionName: "setHedgeFeeFraction",
      args: [parseInt(feeFrac) as unknown as never],
    });
  };

  const handleSetLeverage = () => {
    writeContract({
      address: HOOK_ADDRESS,
      abi: HOOK_ABI,
      functionName: "setLeverage",
      args: [BigInt(leverage)],
    });
  };

  if (!address) return null;

  return (
    <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings size={16} className="text-[#7c3aed]" />
        <h3 className="font-bold text-[15px] text-white">Owner Controls</h3>
        <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#7c3aed]/15 text-[#a78bfa]">
          Owner Only
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fee fraction */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">
            Hedge Fee Fraction (basis points)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={feeFrac}
              onChange={(e) => setFeeFrac(e.target.value)}
              min={0}
              max={100000}
              className="flex-1 bg-[#080b12] border border-[#1f2d47] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#ff007a] transition-colors"
            />
            <button
              onClick={handleSetFee}
              disabled={isConfirming}
              className="px-4 py-2 bg-[#ff007a] hover:opacity-90 disabled:opacity-50 text-white font-bold text-[13px] rounded-lg transition-opacity flex items-center gap-1.5"
            >
              {isConfirming && <Loader2 size={12} className="animate-spin" />}
              Set
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Current: 1000 bps = 10% of swap fees
          </div>
        </div>

        {/* Leverage */}
        <div>
          <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">
            Leverage (1×–100×)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              min={1}
              max={100}
              className="flex-1 bg-[#080b12] border border-[#1f2d47] rounded-lg px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#ff007a] transition-colors"
            />
            <button
              onClick={handleSetLeverage}
              disabled={isConfirming}
              className="px-4 py-2 bg-[#7c3aed] hover:opacity-90 disabled:opacity-50 text-white font-bold text-[13px] rounded-lg transition-opacity flex items-center gap-1.5"
            >
              {isConfirming && <Loader2 size={12} className="animate-spin" />}
              Set
            </button>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Current: 5× default leverage</div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { isConnected, address } = useAccount();

  return (
    <section id="dashboard" className="py-24 bg-[#080b12]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-5 h-px bg-[#ff007a]" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-[#ff007a]">
            Dashboard
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
          Live Hook Metrics
        </h2>
        <p className="text-slate-400 text-base max-w-lg mb-12">
          Connect your wallet to interact with the deployed hook. Metrics below use simulated data for demo — connect to a live deployment for real state.
        </p>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#111827] border border-[#1f2d47] rounded-2xl gap-4">
            <Wallet size={40} className="text-slate-600" />
            <p className="text-slate-400 text-[15px] font-medium">Connect your wallet to view live data</p>
            <p className="text-slate-500 text-[13px]">Use the Connect Wallet button in the top-right corner</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={<Shield size={13} />}
                label="Hook Status"
                value="Active"
                sub="Not paused"
                accent="#10b981"
              />
              <StatCard
                icon={<TrendingDown size={13} />}
                label="Fee Allocation"
                value="10%"
                sub="1000 basis points"
              />
              <StatCard
                icon={<Settings size={13} />}
                label="Leverage"
                value="5×"
                sub="Perp position multiplier"
                accent="#7c3aed"
              />
              <StatCard
                icon={<CheckCircle2 size={13} />}
                label="Hedges Closed"
                value="3"
                sub="This epoch"
                accent="#10b981"
              />
            </div>

            {/* Chart */}
            <div className="bg-[#111827] border border-[#1f2d47] rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-[15px] text-white mb-1">Collateral Vault Growth</h3>
                  <p className="text-slate-500 text-[12px]">Accumulated hedge collateral per swap (ETH) — simulated</p>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                  Simulated
                </span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={mockCollateralData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff007a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ff007a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2d47" />
                  <XAxis dataKey="swap" tick={{ fill: "#4a5d7a", fontSize: 11 }} label={{ value: "Swap #", position: "insideBottom", fill: "#4a5d7a", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#4a5d7a", fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: "#111827", border: "1px solid #1f2d47", borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: "#94a3b8" }}
                    itemStyle={{ color: "#ff007a" }}
                  />
                  <Area type="monotone" dataKey="collateral" stroke="#ff007a" strokeWidth={2} fill="url(#colGrad)" name="Collateral (ETH)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Hedge History */}
            <div className="bg-[#111827] border border-[#1f2d47] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#1f2d47] flex items-center justify-between">
                <h3 className="font-bold text-[15px] text-white">Hedge History</h3>
                <span className="text-[11px] text-slate-500">Simulated — replace with contract events</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#1f2d47]">
                      {["Position ID", "Direction", "Margin", "Status", "PnL"].map((h) => (
                        <th key={h} className="text-left px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockHedgeHistory.map((row) => (
                      <tr key={row.id} className="border-b border-[#1f2d47] hover:bg-[#1a2235] transition-colors">
                        <td className="px-6 py-3 font-mono text-slate-300">{row.id}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${row.type === "SHORT" ? "bg-[#ff007a]/10 text-[#ff007a]" : "bg-[#10b981]/10 text-[#10b981]"}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-300">{row.margin}</td>
                        <td className="px-6 py-3">
                          <span className={`flex items-center gap-1.5 w-fit ${row.status === "Open" ? "text-[#f59e0b]" : "text-slate-400"}`}>
                            {row.status === "Open" ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                            {row.status}
                          </span>
                        </td>
                        <td className={`px-6 py-3 font-mono font-semibold ${row.pnl.startsWith("+") ? "text-[#10b981]" : row.pnl.startsWith("-") ? "text-[#ff007a]" : "text-slate-500"}`}>
                          {row.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Owner Config Panel */}
            <ConfigPanel />

            {/* Contract address callout */}
            <div className="flex items-start gap-3 bg-[#f59e0b]/5 border border-[#f59e0b]/20 rounded-xl p-4">
              <AlertCircle size={16} className="text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#f59e0b] mb-0.5">Deploy the Hook First</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  Live contract reads and writes require deploying{" "}
                  <code className="font-mono text-[#06b6d4]">ReactiveDeltaShieldHook.sol</code> and updating{" "}
                  <code className="font-mono text-[#06b6d4]">HOOK_ADDRESS</code> in{" "}
                  <code className="font-mono text-[#06b6d4]">src/lib/wagmi.ts</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

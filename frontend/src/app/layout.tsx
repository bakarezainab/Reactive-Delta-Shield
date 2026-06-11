import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "@/providers/Web3Provider";

export const metadata: Metadata = {
  title: "Reactive Delta-Shield — Autonomous LP Hedging for Uniswap v4",
  description:
    "A Uniswap v4 hook that autonomously hedges impermanent loss for concentrated LPs using Reactive Network cross-chain callbacks and self-funded swap fee collateral.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}

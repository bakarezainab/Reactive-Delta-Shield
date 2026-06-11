import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Dashboard } from "@/components/Dashboard";
import { Architecture } from "@/components/Architecture";
import { Contracts } from "@/components/Contracts";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Dashboard />
        <Architecture />
        <Contracts />
      </main>
      <Footer />
    </>
  );
}

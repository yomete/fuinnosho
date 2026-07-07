"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCurrentDate } from "@/hooks/use-current-date";
import {
  Film,
  MapPin,
  Github,
  ArrowRight,
  Camera
} from "lucide-react";

// ============================================================================
// MARKETING PAGE - FUINNOSHO
// Aesthetic: Darkroom Editorial - rich, warm, analog photography feel
// ============================================================================

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Top-right warm glow */}
        <div
          className="absolute -top-32 -right-32 w-[800px] h-[800px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, hsl(8 80% 35%) 0%, transparent 70%)" }}
        />
        {/* Bottom-left amber glow */}
        <div
          className="absolute -bottom-48 -left-48 w-[600px] h-[600px] rounded-full opacity-[0.03]"
          style={{ background: "radial-gradient(circle, hsl(35 90% 50%) 0%, transparent 70%)" }}
        />
        {/* Center subtle glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full opacity-[0.02]"
          style={{ background: "radial-gradient(circle, hsl(30 60% 40%) 0%, transparent 60%)" }}
        />
      </div>

      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)" }}
      />

      {/* Film Grain Texture */}
      <div
        className="fixed inset-0 pointer-events-none z-[2] opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        <Navigation />
        <Hero />
        <Features />
        <Footer />
      </div>
    </div>
  );
}

// ============================================================================
// NAVIGATION
// ============================================================================

function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "bg-[#0d0b0a]/90 backdrop-blur-xl border-b border-[#2a2420]/50"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center group-hover:border-amber-500/50 transition-colors">
            <Film className="w-5 h-5 text-amber-500" />
          </div>
          <span
            className="text-xl tracking-tight text-[#e8e4e0]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Fūin no Sho
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="https://github.com/yomete/fuinnosho"
            target="_blank"
            className="text-[#8a8078] hover:text-[#e8e4e0] transition-colors flex items-center gap-2 text-sm"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center whitespace-nowrap text-sm text-[#8a8078] transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:text-[#e8e4e0]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-10 items-center whitespace-nowrap rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-[#0d0b0a] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-amber-400 hover:shadow-[0_10px_26px_rgba(245,158,11,0.2)] active:scale-[0.96] sm:px-4"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================

function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main Headline */}
        <h1
          className="text-5xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#e8e4e0] mb-6 animate-slide-up text-balance"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            animationDelay: "100ms",
            animationFillMode: "both"
          }}
        >
          Your film deserves
          <br />
          <span className="text-amber-500">better than a spreadsheet</span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-xl text-[#8a8078] max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up"
          style={{ animationDelay: "200ms", animationFillMode: "both" }}
        >
          Track your film stock, plan photo trips with reservations,
          and keep your gear organized. Everything a film photographer needs,
          nothing more.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
          style={{ animationDelay: "300ms", animationFillMode: "both" }}
        >
          <Link
            href="/register"
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-500 px-8 py-4 text-lg font-medium text-[#0d0b0a] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-amber-400 hover:shadow-[0_12px_30px_rgba(245,158,11,0.2)] active:scale-[0.96]"
          >
            Start for free
            <ArrowRight className="h-5 w-5 transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FEATURES SECTION
// ============================================================================

function Features() {
  const features = [
    {
      icon: Film,
      title: "Film Inventory",
      description: "Track every roll in your fridge. Know what's expiring, what's frozen, what's loaded. Filter by brand, type, ISO, format.",
      color: "amber"
    },
    {
      icon: MapPin,
      title: "Trip Planning",
      description: "Plan your photo trips and reserve specific films for each journey. Never show up unprepared again.",
      color: "emerald"
    },
    {
      icon: Camera,
      title: "Gear Management",
      description: "Catalog your cameras, lenses, and accessories. Track condition, value, and lending history.",
      color: "sky"
    }
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2
            className="text-4xl sm:text-5xl font-light text-[#e8e4e0] mb-4 text-balance"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Everything you need,
            <br />
            <span className="text-[#8a8078]">nothing you don&apos;t</span>
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index
}: {
  feature: {
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
  };
  index: number;
}) {
  const colorMap: Record<string, string> = {
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40",
    sky: "from-sky-500/20 to-sky-600/5 border-sky-500/20 hover:border-sky-500/40",
  };

  const iconColorMap: Record<string, string> = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    sky: "text-sky-500",
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-gradient-to-br p-6 transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(0,0,0,0.2)] ${colorMap[feature.color]}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      <div className={`w-12 h-12 rounded-xl bg-[#0d0b0a]/50 flex items-center justify-center mb-4 ${iconColorMap[feature.color]}`}>
        <feature.icon className="w-6 h-6" />
      </div>

      <h3
        className="text-xl text-[#e8e4e0] mb-2"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {feature.title}
      </h3>

      <p className="text-[#8a8078] text-sm leading-relaxed">
        {feature.description}
      </p>
    </div>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  const now = useCurrentDate();

  return (
    <footer className="py-16 px-6 border-t border-[#2a2420]/50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center">
              <Film className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <span
                className="text-lg text-[#e8e4e0]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Fūin no Sho
              </span>
              <p className="text-xs text-[#6a6460]">Film inventory for analog photographers</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm">
            <Link href="https://github.com/yomete/fuinnosho" target="_blank" className="text-[#8a8078] hover:text-[#e8e4e0] transition-colors">
              GitHub
            </Link>
            <Link href="https://github.com/yomete/fuinnosho/blob/main/LICENSE" target="_blank" className="text-[#8a8078] hover:text-[#e8e4e0] transition-colors">
              License
            </Link>
            <Link href="https://github.com/yomete/fuinnosho/blob/main/CONTRIBUTING.md" target="_blank" className="text-[#8a8078] hover:text-[#e8e4e0] transition-colors">
              Contributing
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-[#6a6460]">
            © {now.getFullYear()} Fūin no Sho. Open source.
          </p>
        </div>
      </div>
    </footer>
  );
}

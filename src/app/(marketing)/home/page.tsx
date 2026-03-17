"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Film,
  MapPin,
  FlaskConical,
  Sparkles,
  Github,
  ArrowRight,
  Check,
  Camera,
  Calendar,
  BarChart3,
  Server,
  Cloud,
  Zap,
  Play
} from "lucide-react";
import { DemoShowcasePanel } from "@/components/demo-showcase-panel";

// ============================================================================
// MARKETING PAGE - FUINNOSHO
// Aesthetic: Darkroom Editorial - rich, warm, analog photography feel
// ============================================================================

export default function MarketingPage() {
  const [demoPanelOpen, setDemoPanelOpen] = useState(false);

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
        <Hero onTryDemo={() => setDemoPanelOpen(true)} />
        <Features />
        <AppShowcase onTryDemo={() => setDemoPanelOpen(true)} />
        <Pricing />
        <OpenSourceCallout />
        <Footer />
      </div>

      {/* Demo Panel */}
      <DemoShowcasePanel
        open={demoPanelOpen}
        onOpenChange={setDemoPanelOpen}
      />
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
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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

        <div className="flex items-center gap-6">
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
            className="inline-flex min-h-10 items-center text-sm text-[#8a8078] transition-colors duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:text-[#e8e4e0]"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex min-h-10 items-center rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-[#0d0b0a] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-amber-400 hover:shadow-[0_10px_26px_rgba(245,158,11,0.2)] active:scale-[0.96]"
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

function Hero({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <section className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="max-w-4xl mx-auto text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1614] border border-[#2a2420] mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-[#8a8078]">Now open source</span>
        </div>

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
          log your development chemistry. Everything a film photographer needs,
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
          <button
            onClick={onTryDemo}
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2a2420] bg-[#1a1614] px-8 py-4 text-lg text-[#e8e4e0] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-[#2a2420] hover:border-[#3a3430] active:scale-[0.96]"
          >
            <Play className="w-5 h-5" />
            Try Demo
          </button>
          <Link
            href="https://github.com/yomete/fuinnosho"
            target="_blank"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-transparent bg-transparent px-8 py-4 text-lg text-[#8a8078] transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[#2a2420] hover:bg-[#1a1614] hover:text-[#e8e4e0] active:scale-[0.96]"
          >
            <Github className="w-5 h-5" />
            GitHub
          </Link>
        </div>

        {/* Stats */}
        <div
          className="mt-16 pt-16 border-t border-[#2a2420]/50 grid grid-cols-3 gap-8 animate-slide-up"
          style={{ animationDelay: "400ms", animationFillMode: "both" }}
        >
          <Stat value="559+" label="Tests passing" />
          <Stat value="100%" label="TypeScript" />
          <Stat value="AGPL-3.0" label="License" />
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div
        className="text-3xl sm:text-4xl font-light text-[#e8e4e0] mb-1 tabular-nums"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        {value}
      </div>
      <div className="text-sm text-[#6a6460]">{label}</div>
    </div>
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
      icon: FlaskConical,
      title: "Chemistry Tracking",
      description: "Log your development chemistry, track usage, know when solutions are exhausted. Recipe management included.",
      color: "violet"
    },
    {
      icon: Sparkles,
      title: "AI Recommendations",
      description: "Get smart film suggestions based on your shooting conditions. Powered by OpenAI, available on Pro tier.",
      color: "rose",
      badge: "Pro"
    },
    {
      icon: Camera,
      title: "Gear Management",
      description: "Catalog your cameras, lenses, and accessories. Track condition, value, and lending history.",
      color: "sky"
    },
    {
      icon: BarChart3,
      title: "Usage Analytics",
      description: "Understand your shooting patterns. See trends over time, predict when you'll need more stock.",
      color: "orange"
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
            <span className="text-[#8a8078]">nothing you don't</span>
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
    badge?: string;
  };
  index: number;
}) {
  const colorMap: Record<string, string> = {
    amber: "from-amber-500/20 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40",
    emerald: "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40",
    violet: "from-violet-500/20 to-violet-600/5 border-violet-500/20 hover:border-violet-500/40",
    rose: "from-rose-500/20 to-rose-600/5 border-rose-500/20 hover:border-rose-500/40",
    sky: "from-sky-500/20 to-sky-600/5 border-sky-500/20 hover:border-sky-500/40",
    orange: "from-orange-500/20 to-orange-600/5 border-orange-500/20 hover:border-orange-500/40"
  };

  const iconColorMap: Record<string, string> = {
    amber: "text-amber-500",
    emerald: "text-emerald-500",
    violet: "text-violet-500",
    rose: "text-rose-500",
    sky: "text-sky-500",
    orange: "text-orange-500"
  };

  return (
    <div
      className={`group relative rounded-2xl border bg-gradient-to-br p-6 transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:shadow-[0_16px_38px_rgba(0,0,0,0.2)] ${colorMap[feature.color]}`}
      style={{
        animationDelay: `${index * 100}ms`,
      }}
    >
      {feature.badge && (
        <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-500 rounded-full border border-amber-500/30">
          {feature.badge}
        </span>
      )}

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
// APP SHOWCASE
// ============================================================================

function AppShowcase({ onTryDemo }: { onTryDemo: () => void }) {
  return (
    <section className="py-32 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-light text-[#e8e4e0] mb-4 text-balance"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Designed for the darkroom
          </h2>
          <p className="text-[#8a8078] text-lg max-w-2xl mx-auto mb-6">
            A dark theme that's easy on the eyes, with film grain texture and
            warm amber accents that feel right at home in your workflow.
          </p>
          <button
            onClick={onTryDemo}
            className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2a2420] bg-[#1a1614] px-6 py-3 text-[#e8e4e0] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[#3a3430] hover:bg-[#2a2420] active:scale-[0.96]"
          >
            <Play className="w-4 h-4" />
            Try the interactive demo
            <ArrowRight className="h-4 w-4 translate-x-[-8px] opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0 group-hover:opacity-100" />
          </button>
        </div>

        {/* App Preview */}
        <div className="relative">
          {/* Glow behind the preview */}
          <div
            className="absolute inset-0 blur-3xl opacity-20"
            style={{ background: "linear-gradient(135deg, hsl(35 80% 50%) 0%, hsl(8 60% 40%) 100%)" }}
          />

          {/* Mock Browser Window */}
          <div className="relative rounded-2xl overflow-hidden border border-[#2a2420] bg-[#0d0b0a] shadow-2xl">
            {/* Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1614] border-b border-[#2a2420]">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28ca41]" />
              </div>
              <div className="flex-1 mx-4">
                <div className="max-w-md mx-auto px-4 py-1.5 rounded-lg bg-[#0d0b0a] border border-[#2a2420] text-sm text-[#6a6460] text-center">
                  app.fuinnosho.com/films
                </div>
              </div>
            </div>

            {/* App Content Preview */}
            <div className="p-8 min-h-[400px] bg-[#0d0b0a]">
              {/* Header */}
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3
                    className="text-3xl text-[#e8e4e0] mb-1"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    Film Inventory
                  </h3>
                  <p className="text-[#8a8078]">47 rolls ready to shoot</p>
                </div>
                <button className="px-4 py-2 bg-amber-500 text-[#0d0b0a] rounded-lg text-sm font-medium">
                  + Add Film
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { label: "Total Rolls", value: "47", color: "amber" },
                  { label: "Color", value: "28", color: "amber" },
                  { label: "B&W", value: "15", color: "zinc" },
                  { label: "Slide", value: "4", color: "emerald" }
                ].map((stat) => (
                  <div key={stat.label} className="p-4 rounded-xl bg-[#1a1614] border border-[#2a2420]">
                    <div className="text-2xl text-[#e8e4e0] font-light mb-1 tabular-nums">{stat.value}</div>
                    <div className="text-xs text-[#6a6460]">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Film Cards Preview */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Portra 400", brand: "Kodak", count: 8, type: "color" },
                  { name: "HP5 Plus", brand: "Ilford", count: 6, type: "bw" },
                  { name: "Velvia 50", brand: "Fujifilm", count: 4, type: "slide" }
                ].map((film) => (
                  <div key={film.name} className="p-4 rounded-xl bg-gradient-to-br from-zinc-500/10 to-zinc-600/5 border border-[#2a2420]">
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="text-[#e8e4e0]"
                        style={{ fontFamily: "Georgia, serif" }}
                      >
                        {film.name}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${
                        film.type === "color" ? "bg-amber-500" :
                        film.type === "bw" ? "bg-zinc-400" : "bg-emerald-500"
                      }`} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#6a6460]">{film.brand}</span>
                      <span className="text-[#8a8078] tabular-nums">{film.count} rolls</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// PRICING SECTION
// ============================================================================

function Pricing() {
  const tiers = [
    {
      name: "Self-Hosted",
      price: "Free",
      period: "forever",
      description: "Run it yourself, own your data completely",
      icon: Server,
      features: [
        "Full film inventory management",
        "Gear tracking",
        "Trip planning with reservations",
        "Chemistry & development logging",
        "Basic usage analytics",
        "Community support"
      ],
      cta: "View on GitHub",
      href: "https://github.com/yomete/fuinnosho",
      variant: "outline" as const
    },
    {
      name: "Cloud Basic",
      price: "$5",
      period: "/month",
      description: "No setup required, we handle everything",
      icon: Cloud,
      features: [
        "Everything in Self-Hosted",
        "Hosted database (no Supabase setup)",
        "Automatic daily backups",
        "Cloud sync across devices",
        "Progressive Web App",
        "Email support"
      ],
      cta: "Coming Soon",
      href: "#",
      variant: "outline" as const,
      disabled: true
    },
    {
      name: "Cloud Pro",
      price: "$15",
      period: "/month",
      description: "For serious film photographers",
      icon: Zap,
      popular: true,
      features: [
        "Everything in Cloud Basic",
        "AI film recommendations",
        "Advanced analytics & predictions",
        "Pre-configured MCP/Claude integration",
        "Lab integration features",
        "Priority support"
      ],
      cta: "Coming Soon",
      href: "#",
      variant: "primary" as const,
      disabled: true
    }
  ];

  return (
    <section className="py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-4xl sm:text-5xl font-light text-[#e8e4e0] mb-4 text-balance"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Simple, transparent pricing
          </h2>
          <p className="text-[#8a8078] text-lg max-w-2xl mx-auto">
            Self-host for free, or let us handle the infrastructure.
            No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <PricingCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  tier
}: {
  tier: {
    name: string;
    price: string;
    period: string;
    description: string;
    icon: React.ElementType;
    features: string[];
    cta: string;
    href: string;
    variant: "outline" | "primary";
    popular?: boolean;
    disabled?: boolean;
  }
}) {
  return (
    <div className={`relative rounded-2xl border p-8 transition-[border-color,transform,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-0.5 ${
      tier.popular
        ? "bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30"
        : "bg-[#1a1614] border-[#2a2420] hover:border-[#3a3430] hover:shadow-[0_16px_38px_rgba(0,0,0,0.16)]"
    }`}>
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-[#0d0b0a] text-xs font-medium rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          tier.popular ? "bg-amber-500/20 text-amber-500" : "bg-[#2a2420] text-[#8a8078]"
        }`}>
          <tier.icon className="w-6 h-6" />
        </div>

        <h3
          className="text-2xl text-[#e8e4e0] mb-1"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {tier.name}
        </h3>

        <p className="text-sm text-[#6a6460] mb-4">{tier.description}</p>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl text-[#e8e4e0] tabular-nums">{tier.price}</span>
          <span className="text-[#6a6460]">{tier.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-8">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3 text-sm">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              tier.popular ? "text-amber-500" : "text-emerald-500"
            }`} />
            <span className="text-[#8a8078]">{feature}</span>
          </li>
        ))}
      </ul>

      {tier.disabled ? (
        <button
          disabled
          className="w-full py-3 rounded-xl text-sm font-medium bg-[#2a2420] text-[#6a6460] cursor-not-allowed"
        >
          {tier.cta}
        </button>
      ) : (
        <Link
          href={tier.href}
          target={tier.href.startsWith("http") ? "_blank" : undefined}
          className={`block w-full py-3 rounded-xl text-sm font-medium text-center transition-colors ${
            tier.variant === "primary"
              ? "bg-amber-500 hover:bg-amber-400 text-[#0d0b0a]"
              : "bg-[#2a2420] hover:bg-[#3a3430] text-[#e8e4e0]"
          }`}
        >
          {tier.cta}
        </Link>
      )}
    </div>
  );
}

// ============================================================================
// OPEN SOURCE CALLOUT
// ============================================================================

function OpenSourceCallout() {
  return (
    <section className="py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative p-12 rounded-3xl bg-gradient-to-br from-[#1a1614] to-[#0d0b0a] border border-[#2a2420] overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.03) 20px,
                rgba(255,255,255,0.03) 40px
              )`
            }} />
          </div>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2a2420] mb-6">
              <Github className="w-8 h-8 text-[#e8e4e0]" />
            </div>

            <h2
              className="text-3xl sm:text-4xl font-light text-[#e8e4e0] mb-4 text-balance"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Built in the open
            </h2>

            <p className="text-[#8a8078] text-lg max-w-xl mx-auto mb-8 leading-relaxed">
              Fuinnosho is open source under the AGPL-3.0 license.
              Run it yourself, contribute to the codebase, or let us
              handle the infrastructure with our cloud offering.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="https://github.com/yomete/fuinnosho"
                target="_blank"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3a3430] bg-[#2a2420] px-6 py-3 text-[#e8e4e0] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-[#3a3430] hover:shadow-[0_14px_30px_rgba(0,0,0,0.18)] active:scale-[0.96]"
              >
                <Github className="w-5 h-5" />
                Star on GitHub
                <ArrowRight className="h-4 w-4 translate-x-[-8px] opacity-0 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:translate-x-0 group-hover:opacity-100" />
              </Link>
              <Link
                href="https://github.com/yomete/fuinnosho/blob/main/CONTRIBUTING.md"
                target="_blank"
                className="text-[#8a8078] hover:text-[#e8e4e0] transition-colors flex items-center gap-2"
              >
                Read Contributing Guide
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
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
            © {new Date().getFullYear()} Fūin no Sho. Open source.
          </p>
        </div>
      </div>
    </footer>
  );
}

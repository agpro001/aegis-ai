import { motion } from "framer-motion";
import { Shield, Zap, Eye, AlertTriangle, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MatrixRain } from "@/components/MatrixRain";
import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: Shield,
    title: "AI Sentinels",
    description: "Deploy autonomous AI agents that monitor your smart contracts 24/7 across social, news, and on-chain data.",
    color: "text-neon-cyan",
  },
  {
    icon: Eye,
    title: "Real-Time Pulse",
    description: "Live threat analysis powered by AI. Every tweet, every article, analyzed in real-time for security threats.",
    color: "text-neon-green",
  },
  {
    icon: AlertTriangle,
    title: "Instant Response",
    description: "Automated incident detection with configurable sensitivity from cautious to paranoid mode.",
    color: "text-neon-yellow",
  },
  {
    icon: Lock,
    title: "Black Box Forensics",
    description: "Every incident recorded with the exact evidence that triggered the alert. Full transparency, always.",
    color: "text-neon-magenta",
  },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background cyber-grid">
      <MatrixRain />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-display text-xl font-bold tracking-wider text-primary text-glow-cyan">
            AEGIS-AI
          </span>
        </motion.div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            onClick={() => navigate("/auth")}
            className="font-body text-base"
          >
            Sign In
          </Button>
          <Button
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary text-primary-foreground font-body text-base glow-cyan"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="mb-8"
          >
            <Shield className="mx-auto h-20 w-20 text-primary animate-glow-pulse" />
          </motion.div>

          <h1 className="mb-4 font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Mission Control for{" "}
            <span className="text-primary text-glow-cyan">DeFi Security</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl font-body text-lg text-muted-foreground sm:text-xl">
            Deploy autonomous AI sentinels that monitor, analyze, and protect your
            smart contracts from exploits — in real-time.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="bg-primary text-primary-foreground font-body text-lg glow-cyan gap-2"
            >
              Launch Dashboard <ChevronRight className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/demo")}
              className="border-primary/30 font-body text-lg"
            >
              <Zap className="mr-2 h-5 w-5 text-neon-yellow" /> Watch Demo
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4"
        >
          {[
            { label: "Protocols Protected", value: "150+" },
            { label: "Threats Detected", value: "2.4K" },
            { label: "Avg Response Time", value: "<3s" },
            { label: "Uptime", value: "99.97%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-display text-3xl font-bold text-primary text-glow-cyan">
                {stat.value}
              </div>
              <div className="font-body text-sm text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-20 lg:px-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-12 text-center font-display text-3xl font-bold text-foreground"
        >
          Your <span className="text-primary text-glow-cyan">Defense Arsenal</span>
        </motion.h2>
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group rounded-xl border border-border bg-card/60 p-6 backdrop-blur-sm transition-all hover:border-glow-cyan"
            >
              <f.icon className={`mb-4 h-10 w-10 ${f.color}`} />
              <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-card/80 p-12 backdrop-blur-sm glow-cyan"
        >
          <h2 className="mb-4 font-display text-3xl font-bold text-foreground">
            Ready to Protect Your Protocol?
          </h2>
          <p className="mb-8 font-body text-lg text-muted-foreground">
            Set up your first AI sentinel in under 5 minutes. No blockchain
            experience required.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth?mode=signup")}
            className="bg-primary text-primary-foreground font-body text-lg glow-cyan"
          >
            Deploy Your Sentinel <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8 text-center">
        <p className="font-body text-sm text-muted-foreground">
          © 2026 Aegis-AI. Used with Chainlink CRE.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

import { motion } from "framer-motion";
import { Shield, AlertTriangle, Activity, Clock, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState } from "react";

const ThreatMeter = ({ score }: { score: number }) => {
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 70 ? "hsl(var(--neon-green))" : score > 40 ? "hsl(var(--neon-yellow))" : "hsl(var(--neon-red))";
  const label = score > 70 ? "SAFE" : score > 40 ? "CAUTION" : "CRITICAL";

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="120" viewBox="0 0 200 120">
        <path d="M 10 110 A 80 80 0 0 1 190 110" fill="none" stroke="hsl(var(--border))" strokeWidth="12" strokeLinecap="round" />
        <motion.path
          d="M 10 110 A 80 80 0 0 1 190 110"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        <text x="100" y="90" textAnchor="middle" className="font-display" fill="currentColor" fontSize="28" fontWeight="bold">
          {score}
        </text>
        <text x="100" y="110" textAnchor="middle" className="font-body" fill={color} fontSize="12" fontWeight="600">
          {label}
        </text>
      </svg>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color, delay }: any) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
    <Card className="border-border bg-card/60 backdrop-blur-sm hover:border-glow-cyan transition-all">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-lg p-2.5 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-body text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const IntelFeed = () => {
  const [entries, setEntries] = useState<Array<{ time: string; text: string; level: string }>>([]);

  useEffect(() => {
    const mock = [
      { time: "10:42:15", text: "Analyzing @PeckShield tweet → AI: SAFE (confidence: 0.92)", level: "safe" },
      { time: "10:43:02", text: "CryptoPanic feed scanned → No threats detected", level: "safe" },
      { time: "10:44:30", text: "Keyword spike: 'exploit' mentioned 3x → AI: WATCH (confidence: 0.67)", level: "watch" },
      { time: "10:45:01", text: "@ZachXBT reports suspicious tx on Protocol X → AI: CRITICAL (confidence: 0.94)", level: "critical" },
      { time: "10:45:45", text: "Cross-referencing sources... Threat verified by 2 accounts", level: "critical" },
      { time: "10:46:12", text: "Routine scan complete → All monitored contracts stable", level: "safe" },
    ];
    const timer = setInterval(() => {
      setEntries((prev) => {
        const next = mock[prev.length % mock.length];
        const now = new Date();
        return [
          { ...next, time: now.toLocaleTimeString() },
          ...prev,
        ].slice(0, 50);
      });
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const levelColors: Record<string, string> = {
    safe: "text-neon-green",
    watch: "text-neon-yellow",
    critical: "text-neon-red",
  };

  return (
    <div className="h-80 overflow-y-auto space-y-1.5 font-mono text-xs">
      {entries.map((entry, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`flex gap-2 rounded px-2 py-1 ${i === 0 ? "bg-secondary/50" : ""}`}
        >
          <span className="text-muted-foreground shrink-0">[{entry.time}]</span>
          <span className={levelColors[entry.level] || "text-foreground"}>{entry.text}</span>
        </motion.div>
      ))}
      {entries.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Initializing intelligence feed...</p>
      )}
    </div>
  );
};

const Dashboard = () => {
  const [heartbeat, setHeartbeat] = useState("3s ago");

  useEffect(() => {
    let seconds = 3;
    const interval = setInterval(() => {
      seconds = seconds >= 30 ? 0 : seconds + 1;
      setHeartbeat(`${seconds}s ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Pulse Dashboard</h1>
            <p className="font-body text-muted-foreground">Real-time threat monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-neon-green" />
            </span>
            <span className="font-mono text-xs text-neon-green">CRE Active • Last check: {heartbeat}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Shield} label="Total Checks" value="12,847" color="bg-neon-cyan/10 text-neon-cyan" delay={0} />
          <StatCard icon={AlertTriangle} label="Threats Detected" value="23" color="bg-neon-red/10 text-neon-red" delay={0.1} />
          <StatCard icon={Clock} label="Uptime" value="99.97%" color="bg-neon-green/10 text-neon-green" delay={0.2} />
          <StatCard icon={Zap} label="Avg Response" value="2.3s" color="bg-neon-yellow/10 text-neon-yellow" delay={0.3} />
        </div>

        {/* Threat Meter + Feed */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Threat Meter
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ThreatMeter score={78} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Live Intelligence Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <IntelFeed />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;

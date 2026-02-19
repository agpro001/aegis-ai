import { motion } from "framer-motion";
import { Globe, Shield, AlertTriangle, Zap, Activity, Radio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState } from "react";

const attackTypes = [
  { label: "Malware", color: "bg-neon-red", textColor: "text-neon-red", icon: "🔴" },
  { label: "Phishing", color: "bg-neon-yellow", textColor: "text-neon-yellow", icon: "🟡" },
  { label: "Exploit", color: "bg-neon-magenta", textColor: "text-neon-magenta", icon: "🟣" },
  { label: "Ransomware", color: "bg-neon-cyan", textColor: "text-neon-cyan", icon: "🔵" },
  { label: "DDoS", color: "bg-neon-green", textColor: "text-neon-green", icon: "🟢" },
];

const liveFeed = [
  { from: "Russia", to: "United States", type: "Malware", time: "now" },
  { from: "China", to: "Germany", type: "Exploit", time: "2s ago" },
  { from: "Brazil", to: "UK", type: "Phishing", time: "5s ago" },
  { from: "Iran", to: "Israel", type: "DDoS", time: "8s ago" },
  { from: "North Korea", to: "South Korea", type: "Ransomware", time: "12s ago" },
  { from: "Nigeria", to: "France", type: "Phishing", time: "15s ago" },
  { from: "Vietnam", to: "Japan", type: "Exploit", time: "18s ago" },
  { from: "Ukraine", to: "Poland", type: "Malware", time: "22s ago" },
];

const ThreatMap = () => {
  const [attackCount, setAttackCount] = useState(1_847_293);
  const [feedIndex, setFeedIndex] = useState(0);
  const [visibleFeed, setVisibleFeed] = useState(liveFeed.slice(0, 5));

  // Simulate incrementing attack counter
  useEffect(() => {
    const interval = setInterval(() => {
      setAttackCount((prev) => prev + Math.floor(Math.random() * 12) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Cycle live feed entries
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedIndex((prev) => {
        const next = (prev + 1) % liveFeed.length;
        const newFeed = [];
        for (let i = 0; i < 5; i++) {
          newFeed.push(liveFeed[(next + i) % liveFeed.length]);
        }
        setVisibleFeed(newFeed);
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) =>
    attackTypes.find((a) => a.label === type)?.textColor || "text-foreground";

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Live Cyber Threat Map
            </h1>
            <p className="font-body text-sm text-muted-foreground">
              Real-time global attack visualization powered by Kaspersky ThreatCloud
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-red opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-neon-red" />
            </span>
            <span className="font-mono text-xs text-neon-red">LIVE</span>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Zap, label: "Attacks Today", value: attackCount.toLocaleString(), color: "text-neon-red" },
            { icon: Shield, label: "Blocked", value: Math.floor(attackCount * 0.97).toLocaleString(), color: "text-neon-green" },
            { icon: AlertTriangle, label: "Active Campaigns", value: "37", color: "text-neon-yellow" },
            { icon: Activity, label: "Threat Level", value: "HIGH", color: "text-neon-magenta" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border bg-card/60 backdrop-blur-sm">
                <CardContent className="flex items-center gap-3 p-3">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <div>
                    <p className="font-body text-[10px] text-muted-foreground">{stat.label}</p>
                    <p className={`font-display text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Map + Sidebar */}
        <div className="grid gap-4 lg:grid-cols-4">
          {/* Map iframe */}
          <motion.div
            className="lg:col-span-3 rounded-xl overflow-hidden border border-border relative"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border">
              <Radio className="h-3 w-3 text-neon-red animate-pulse" />
              <span className="font-mono text-[10px] text-neon-red">REAL-TIME FEED</span>
            </div>
            <iframe
              src="https://cybermap.kaspersky.com/en/widget/"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              className="w-full min-h-[500px] lg:min-h-[600px]"
              style={{ filter: "brightness(0.85) contrast(1.15)" }}
              title="Live Cyber Threat Map"
              loading="lazy"
            />
          </motion.div>

          {/* Live Feed Sidebar */}
          <div className="space-y-3">
            {/* Attack Type Legend */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3 space-y-2">
                <p className="font-display text-xs font-semibold text-foreground mb-2">Attack Types</p>
                {attackTypes.map((type) => (
                  <div key={type.label} className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${type.color}`} />
                    <span className={`font-mono text-[11px] ${type.textColor}`}>{type.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Live Attack Feed */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3">
                <p className="font-display text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="h-3 w-3 text-primary" /> Live Attacks
                </p>
                <div className="space-y-2">
                  {visibleFeed.map((entry, i) => (
                    <motion.div
                      key={`${entry.from}-${entry.to}-${i}-${feedIndex}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="flex flex-col gap-0.5 rounded-md bg-secondary/30 px-2 py-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-[10px] font-bold ${getTypeColor(entry.type)}`}>
                          {entry.type.toUpperCase()}
                        </span>
                        <span className="font-mono text-[9px] text-muted-foreground">{entry.time}</span>
                      </div>
                      <div className="font-mono text-[10px] text-foreground">
                        {entry.from} → {entry.to}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Targeted */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3">
                <p className="font-display text-xs font-semibold text-foreground mb-2">Top Targeted</p>
                {["🇺🇸 United States", "🇩🇪 Germany", "🇬🇧 United Kingdom", "🇯🇵 Japan", "🇫🇷 France"].map((c, i) => (
                  <div key={c} className="flex items-center justify-between py-1">
                    <span className="font-mono text-[11px] text-foreground">{c}</span>
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-neon-red"
                        initial={{ width: 0 }}
                        animate={{ width: `${95 - i * 15}%` }}
                        transition={{ duration: 1, delay: i * 0.15 }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="font-body text-[10px] text-muted-foreground text-center">
          Live threat data provided by Kaspersky Real-Time Cyber Threat Map
        </p>
      </div>
    </AppLayout>
  );
};

export default ThreatMap;

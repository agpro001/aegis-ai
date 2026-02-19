import { motion, AnimatePresence } from "framer-motion";
import { Globe, Shield, AlertTriangle, Zap, Activity, Radio, TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/AppLayout";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const attackTypes = [
  { label: "Malware", color: "bg-neon-red", textColor: "text-neon-red" },
  { label: "Phishing", color: "bg-neon-yellow", textColor: "text-neon-yellow" },
  { label: "Exploit", color: "bg-neon-magenta", textColor: "text-neon-magenta" },
  { label: "Ransomware", color: "bg-neon-cyan", textColor: "text-neon-cyan" },
  { label: "DDoS", color: "bg-neon-green", textColor: "text-neon-green" },
  { label: "Botnet", color: "bg-primary", textColor: "text-primary" },
  { label: "Trojan", color: "bg-destructive", textColor: "text-destructive" },
  { label: "Worm", color: "bg-accent-foreground", textColor: "text-accent-foreground" },
];

type AttackEvent = {
  from_country: string;
  from_flag: string;
  to_country: string;
  to_flag: string;
  attack_type: string;
  severity: string;
  seconds_ago: number;
};

type CountryData = {
  name: string;
  flag: string;
  percentage: number;
  attack_count: number;
};

type IndustryData = {
  name: string;
  icon: string;
  threat_count: number;
  trend: "up" | "down" | "stable";
  trend_percent: number;
};

type ThreatData = {
  attacks_today: number;
  blocked_percentage: number;
  active_campaigns: number;
  threat_level: string;
  recent_attacks: AttackEvent[];
  top_countries: CountryData[];
  top_industries: IndustryData[];
};

const severityColors: Record<string, string> = {
  critical: "text-neon-red",
  high: "text-neon-magenta",
  medium: "text-neon-yellow",
  low: "text-neon-green",
};

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === "up") return <TrendingUp className="h-3 w-3 text-neon-red" />;
  if (trend === "down") return <TrendingDown className="h-3 w-3 text-neon-green" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
};

const ThreatMap = () => {
  const [data, setData] = useState<ThreatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [attackCount, setAttackCount] = useState(0);
  const [feedPage, setFeedPage] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke("threat-map-data");
      if (error) throw error;
      if (result?.success && result.data) {
        setData(result.data);
        setAttackCount(result.data.attacks_today);
      }
    } catch (e) {
      console.error("Failed to fetch threat data:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Increment attack counter between polls
  useEffect(() => {
    const interval = setInterval(() => {
      setAttackCount((p) => p + Math.floor(Math.random() * 15) + 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Cycle feed
  useEffect(() => {
    const interval = setInterval(() => setFeedPage((p) => p + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) =>
    attackTypes.find((a) => a.label === type)?.textColor || "text-foreground";

  const visibleAttacks = data?.recent_attacks
    ? data.recent_attacks.slice((feedPage * 5) % data.recent_attacks.length, ((feedPage * 5) % data.recent_attacks.length) + 5)
    : [];

  // Wrap around if we exceed the array
  const displayAttacks = data?.recent_attacks
    ? (() => {
        const start = (feedPage * 5) % data.recent_attacks.length;
        const result: AttackEvent[] = [];
        for (let i = 0; i < 5; i++) {
          result.push(data.recent_attacks[(start + i) % data.recent_attacks.length]);
        }
        return result;
      })()
    : [];

  const stats = [
    { icon: Zap, label: "Attacks Today", value: attackCount.toLocaleString(), color: "text-neon-red" },
    { icon: Shield, label: "Blocked", value: data ? `${data.blocked_percentage}%` : "—", color: "text-neon-green" },
    { icon: AlertTriangle, label: "Active Campaigns", value: data?.active_campaigns?.toString() || "—", color: "text-neon-yellow" },
    { icon: Activity, label: "Threat Level", value: data?.threat_level || "—", color: "text-neon-magenta" },
  ];

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
              Real-time global attack visualization powered by FortiGuard ThreatCloud
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
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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
              src="https://threatmap.fortiguard.com/"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              className="w-full min-h-[500px] lg:min-h-[600px]"
              style={{ filter: "grayscale(0.4) contrast(1.1)" }}
              title="FortiGuard Live Cyber Threat Map"
              loading="lazy"
            />
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-3">
            {/* Attack Type Legend */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3 space-y-1.5">
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
                  <Activity className="h-3 w-3 text-primary" /> Real-Time Attacks
                </p>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {displayAttacks.map((entry, i) => (
                        <motion.div
                          key={`${entry.from_country}-${entry.to_country}-${feedPage}-${i}`}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex flex-col gap-0.5 rounded-md bg-secondary/30 px-2 py-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-[10px] font-bold ${getTypeColor(entry.attack_type)}`}>
                              {entry.attack_type.toUpperCase()}
                            </span>
                            <span className={`font-mono text-[9px] ${severityColors[entry.severity] || "text-muted-foreground"}`}>
                              {entry.severity.toUpperCase()} · {entry.seconds_ago}s ago
                            </span>
                          </div>
                          <div className="font-mono text-[10px] text-foreground">
                            {entry.from_flag} {entry.from_country} → {entry.to_flag} {entry.to_country}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Targeted Countries */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3">
                <p className="font-display text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Globe className="h-3 w-3 text-primary" /> Top Targeted Countries
                </p>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
                  </div>
                ) : (
                  data?.top_countries?.slice(0, 8).map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between py-1">
                      <span className="font-mono text-[11px] text-foreground">
                        {c.flag} {c.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-muted-foreground">{c.percentage}%</span>
                        <div className="w-14 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-neon-red"
                            initial={{ width: 0 }}
                            animate={{ width: `${c.percentage}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Top Targeted Industries */}
            <Card className="border-border bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3">
                <p className="font-display text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-primary" /> Top Targeted Industries
                </p>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {data?.top_industries?.map((ind) => (
                      <div key={ind.name} className="flex items-center justify-between rounded-md bg-secondary/20 px-2 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{ind.icon}</span>
                          <span className="font-mono text-[11px] text-foreground">{ind.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {ind.threat_count.toLocaleString()}K
                          </span>
                          <TrendIcon trend={ind.trend} />
                          <span className={`font-mono text-[9px] ${ind.trend === "up" ? "text-neon-red" : ind.trend === "down" ? "text-neon-green" : "text-muted-foreground"}`}>
                            {ind.trend_percent}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <p className="font-body text-[10px] text-muted-foreground text-center">
          Live threat data provided by FortiGuard Real-Time Threat Map
        </p>
      </div>
    </AppLayout>
  );
};

export default ThreatMap;

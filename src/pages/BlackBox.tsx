import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, FileText, AlertTriangle, ExternalLink, RefreshCw, History, Skull } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const severityColors: Record<string, string> = {
  critical: "bg-neon-red/10 text-neon-red border-neon-red/20",
  warning: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20",
  info: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
};

const statusColors: Record<string, string> = {
  paused: "bg-neon-red/10 text-neon-red",
  resolved: "bg-neon-green/10 text-neon-green",
  investigating: "bg-neon-yellow/10 text-neon-yellow",
};

const historicalExploits = [
  {
    name: "Ronin Bridge Hack",
    date: "March 2022",
    loss: "$624M",
    type: "Private Key Compromise",
    description: "Attackers compromised 5 of 9 validator nodes on the Ronin bridge through social engineering, draining 173,600 ETH and 25.5M USDC.",
    severity: "critical",
  },
  {
    name: "Wormhole Bridge Exploit",
    date: "February 2022",
    loss: "$326M",
    type: "Smart Contract Vulnerability",
    description: "Attacker exploited a signature verification bug to mint 120,000 wETH on Solana without depositing equivalent ETH.",
    severity: "critical",
  },
  {
    name: "Nomad Bridge Attack",
    date: "August 2022",
    loss: "$190M",
    type: "Initialization Bug",
    description: "A routine upgrade accidentally set the trusted root to 0x00, allowing anyone to prove arbitrary messages and drain funds.",
    severity: "critical",
  },
  {
    name: "Euler Finance Flash Loan",
    date: "March 2023",
    loss: "$197M",
    type: "Flash Loan Attack",
    description: "Attacker used flash loans to manipulate donation function, creating bad debt and draining multiple token pools.",
    severity: "critical",
  },
  {
    name: "Curve Finance Pool Exploit",
    date: "July 2023",
    loss: "$73.5M",
    type: "Reentrancy Vulnerability",
    description: "Vyper compiler bug in versions 0.2.15-0.3.0 allowed reentrancy attacks on multiple Curve stable pools.",
    severity: "critical",
  },
];

const BlackBox = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (user) loadIncidents();
  }, [user]);

  // Auto-cycle historical exploits
  useEffect(() => {
    if (!showHistory) return;
    const timer = setInterval(() => {
      setHistoryIndex((prev) => (prev + 1) % historicalExploits.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [showHistory]);

  const loadIncidents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("incidents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) {
      setIncidents(data);
      if (data.length > 0 && !selected) setSelected(data[0]);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <Box className="h-7 w-7 text-neon-magenta" /> Black Box
          </h1>
          <p className="font-body text-muted-foreground">Incident forensics & response</p>
        </div>

        {/* Historical Exploits Showcase */}
        {showHistory && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-neon-magenta/20 bg-card/60 backdrop-blur-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4 text-neon-magenta" /> Biggest DeFi Exploits in History
                  </span>
                  <div className="flex gap-1">
                    {historicalExploits.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setHistoryIndex(i)}
                        className={`h-1.5 rounded-full transition-all ${i === historyIndex ? "w-6 bg-neon-magenta" : "w-1.5 bg-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={historyIndex}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-start gap-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neon-red/10">
                      <Skull className="h-6 w-6 text-neon-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-display text-base font-bold text-foreground">{historicalExploits[historyIndex].name}</h3>
                        <span className="font-display text-lg font-bold text-neon-red">{historicalExploits[historyIndex].loss}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-[10px] bg-neon-red/10 text-neon-red border-neon-red/20">
                          {historicalExploits[historyIndex].type}
                        </Badge>
                        <span className="font-body text-xs text-muted-foreground">{historicalExploits[historyIndex].date}</span>
                      </div>
                      <p className="font-body text-sm text-muted-foreground leading-relaxed">{historicalExploits[historyIndex].description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Incident History
                </span>
                <Button size="icon" variant="ghost" onClick={loadIncidents} className="h-6 w-6">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incidents.length === 0 ? (
                <p className="text-center py-8 font-body text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No incidents recorded yet. Your sentinels are keeping watch."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-display text-xs">ID</TableHead>
                      <TableHead className="font-display text-xs">Time</TableHead>
                      <TableHead className="font-display text-xs">Source</TableHead>
                      <TableHead className="font-display text-xs">Severity</TableHead>
                      <TableHead className="font-display text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((inc) => (
                      <TableRow
                        key={inc.id}
                        onClick={() => setSelected(inc)}
                        className={`cursor-pointer hover:bg-secondary/50 ${selected?.id === inc.id ? "bg-secondary/30" : ""}`}
                      >
                        <TableCell className="font-mono text-xs text-primary">{inc.id.slice(0, 8)}</TableCell>
                        <TableCell className="font-body text-xs">{new Date(inc.created_at).toLocaleString()}</TableCell>
                        <TableCell className="font-body text-xs">{inc.source || "AI Analysis"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-mono text-[10px] ${severityColors[inc.severity] || ""}`}>
                            {inc.severity?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`font-mono text-[10px] ${statusColors[inc.status] || ""}`}>
                            {inc.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-neon-red/20 bg-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="font-display text-sm text-neon-red flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Evidence — {selected.id.slice(0, 8)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-border bg-background/50 p-4">
                  <p className="font-mono text-xs text-muted-foreground mb-1">Source: {selected.source || "AI Analysis"}</p>
                  <p className="font-body text-sm text-foreground">{selected.evidence || "No evidence recorded"}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className={`font-display text-lg font-bold ${
                      selected.severity === "critical" ? "text-neon-red" : "text-neon-yellow"
                    }`}>{selected.severity?.toUpperCase()}</p>
                    <p className="font-body text-xs text-muted-foreground">Threat Level</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">{selected.ai_confidence || "N/A"}</p>
                    <p className="font-body text-xs text-muted-foreground">AI Confidence</p>
                  </div>
                  <div>
                    <p className="font-display text-lg font-bold text-foreground">{selected.response_time_ms ? `${(selected.response_time_ms / 1000).toFixed(1)}s` : "N/A"}</p>
                    <p className="font-body text-xs text-muted-foreground">Response Time</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="flex-1 bg-neon-green/10 text-neon-green font-body hover:bg-neon-green/20">
                    Unpause Contract
                  </Button>
                  <Button variant="outline" className="flex-1 font-body gap-2">
                    <ExternalLink className="h-4 w-4" /> View on Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
};

export default BlackBox;

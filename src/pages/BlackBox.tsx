import { motion } from "framer-motion";
import { Box, FileText, AlertTriangle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";

const mockIncidents = [
  {
    id: "INC-001",
    block: 18293401,
    timestamp: "2026-02-15 10:45:01",
    source: "@PeckShield on X",
    severity: "critical",
    status: "paused",
    evidence: "Detected exploit on Protocol X — emergency pause triggered",
  },
  {
    id: "INC-002",
    block: 18291200,
    timestamp: "2026-02-14 08:12:33",
    source: "CryptoPanic News",
    severity: "warning",
    status: "resolved",
    evidence: "Unusual withdrawal pattern detected — false alarm after review",
  },
  {
    id: "INC-003",
    block: 18288100,
    timestamp: "2026-02-13 14:30:22",
    source: "@ZachXBT on X",
    severity: "critical",
    status: "resolved",
    evidence: "Flash loan attack reported on similar protocol — preventive pause",
  },
];

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

const BlackBox = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <Box className="h-7 w-7 text-neon-magenta" /> Black Box
          </h1>
          <p className="font-body text-muted-foreground">Incident forensics & response</p>
        </div>

        {/* Incidents Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Incident History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-display text-xs">ID</TableHead>
                    <TableHead className="font-display text-xs">Block</TableHead>
                    <TableHead className="font-display text-xs">Timestamp</TableHead>
                    <TableHead className="font-display text-xs">Source</TableHead>
                    <TableHead className="font-display text-xs">Severity</TableHead>
                    <TableHead className="font-display text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockIncidents.map((inc) => (
                    <TableRow key={inc.id} className="cursor-pointer hover:bg-secondary/50">
                      <TableCell className="font-mono text-xs text-primary">{inc.id}</TableCell>
                      <TableCell className="font-mono text-xs">#{inc.block}</TableCell>
                      <TableCell className="font-body text-xs">{inc.timestamp}</TableCell>
                      <TableCell className="font-body text-xs">{inc.source}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${severityColors[inc.severity]}`}>
                          {inc.severity.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`font-mono text-[10px] ${statusColors[inc.status]}`}>
                          {inc.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detail card for most recent */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-neon-red/20 bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm text-neon-red flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Smoking Gun — INC-001
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-background/50 p-4">
                <p className="font-mono text-xs text-muted-foreground mb-1">Source: @PeckShield on X</p>
                <p className="font-body text-sm text-foreground">
                  "🚨 Detected exploit on Protocol X — $2.3M drained via flash loan attack targeting price oracle manipulation."
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="font-display text-lg font-bold text-neon-red">CRITICAL</p>
                  <p className="font-body text-xs text-muted-foreground">Threat Level</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">0.94</p>
                  <p className="font-body text-xs text-muted-foreground">AI Confidence</p>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">2.1s</p>
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
      </div>
    </AppLayout>
  );
};

export default BlackBox;

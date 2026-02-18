import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Filter, AlertTriangle, CheckCircle, Mail, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const severityColors: Record<string, string> = {
  critical: "bg-neon-red/10 text-neon-red border-neon-red/20",
  warning: "bg-neon-yellow/10 text-neon-yellow border-neon-yellow/20",
  info: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
};

const AlertsPage = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) loadAlerts();
  }, [user, filter]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("alerts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, (payload) => {
        setAlerts((prev) => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const loadAlerts = async () => {
    setLoading(true);
    let query = supabase
      .from("alerts")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(100);

    if (filter !== "all") {
      query = query.eq("severity", filter);
    }

    const { data } = await query;
    setAlerts(data || []);
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="h-7 w-7 text-neon-yellow" /> Alert History
            </h1>
            <p className="font-body text-muted-foreground">Email alerts & notification log</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-36 font-body text-sm">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Button size="icon" variant="ghost" onClick={loadAlerts} className="h-8 w-8">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Alerts", value: alerts.length, icon: Bell, color: "text-neon-cyan" },
            { label: "Critical", value: alerts.filter(a => a.severity === "critical").length, icon: AlertTriangle, color: "text-neon-red" },
            { label: "Delivered", value: alerts.filter(a => a.status === "sent").length, icon: CheckCircle, color: "text-neon-green" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="border-border bg-card/60 backdrop-blur-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <s.icon className={`h-6 w-6 ${s.color}`} />
                  <div>
                    <p className="font-body text-sm text-muted-foreground">{s.label}</p>
                    <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" /> Alert Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <p className="text-center py-8 font-body text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No alerts yet. Alerts trigger when critical threats are detected."}
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-display text-xs">Time</TableHead>
                      <TableHead className="font-display text-xs">Severity</TableHead>
                      <TableHead className="font-display text-xs">Subject</TableHead>
                      <TableHead className="font-display text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-body text-xs">
                          {new Date(alert.sent_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-mono text-[10px] ${severityColors[alert.severity] || ""}`}>
                            {alert.severity?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-body text-xs max-w-xs truncate">{alert.subject}</TableCell>
                        <TableCell>
                          <Badge className={`font-mono text-[10px] ${
                            alert.status === "sent" ? "bg-neon-green/10 text-neon-green" : "bg-muted text-muted-foreground"
                          }`}>
                            {alert.status?.toUpperCase()}
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
      </div>
    </AppLayout>
  );
};

export default AlertsPage;

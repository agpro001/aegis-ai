import { useState } from "react";
import { motion } from "framer-motion";
import { Radar, Plus, Trash2, Save, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { AppLayout } from "@/components/AppLayout";
import { toast } from "sonner";

const sensitivityLabels: Record<number, { label: string; desc: string; color: string }> = {
  0: { label: "Low", desc: "Only pauses if 3+ trusted sources confirm a hack.", color: "text-neon-green" },
  1: { label: "Medium", desc: "Pauses if 1 major source confirms + high negative sentiment.", color: "text-neon-yellow" },
  2: { label: "Paranoid", desc: "Pauses on ANY significant spike in hack-related keywords.", color: "text-neon-red" },
};

const Sentinels = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [sources, setSources] = useState({ twitter: true, news: true, mempool: false });
  const [twitterKeywords, setTwitterKeywords] = useState("$TOKEN exploit");
  const [sensitivity, setSensitivity] = useState([1]);
  const [saving, setSaving] = useState(false);

  const currentSens = sensitivityLabels[sensitivity[0]];

  const handleSave = async () => {
    if (!contractAddress) {
      toast.error("Please enter a contract address");
      return;
    }
    setSaving(true);
    // TODO: Save to database
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Sentinel configuration saved & deployed!");
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <Radar className="h-7 w-7 text-primary" /> Sentinel Studio
          </h1>
          <p className="font-body text-muted-foreground">Configure your AI security sentinel</p>
        </div>

        {/* Contract Import */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm">Smart Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="0x... Contract Address"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="font-mono bg-background/50"
              />
              <p className="text-xs text-muted-foreground font-body">
                Paste your contract address. Aegis will detect pause/freeze functions automatically.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Source Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm">Monitoring Sources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">Twitter / X</p>
                  <p className="font-body text-xs text-muted-foreground">Monitor accounts & keywords</p>
                </div>
                <Switch checked={sources.twitter} onCheckedChange={(v) => setSources({ ...sources, twitter: v })} />
              </div>
              {sources.twitter && (
                <Input
                  placeholder="Keywords: $TOKEN exploit, @PeckShieldAlert"
                  value={twitterKeywords}
                  onChange={(e) => setTwitterKeywords(e.target.value)}
                  className="font-mono text-sm bg-background/50"
                />
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">Crypto News</p>
                  <p className="font-body text-xs text-muted-foreground">CryptoPanic & news feeds</p>
                </div>
                <Switch checked={sources.news} onCheckedChange={(v) => setSources({ ...sources, news: v })} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">Mempool Monitor</p>
                    <p className="font-body text-xs text-muted-foreground">Watch pending high-gas transactions</p>
                  </div>
                  <span className="rounded-full bg-neon-yellow/10 px-2 py-0.5 font-mono text-[10px] text-neon-yellow">
                    COMING SOON
                  </span>
                </div>
                <Switch checked={sources.mempool} disabled />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sensitivity */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border bg-card/60 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-display text-sm">Sensitivity Threshold</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Slider value={sensitivity} onValueChange={setSensitivity} min={0} max={2} step={1} />
              <div className="flex items-center gap-2">
                <AlertCircle className={`h-4 w-4 ${currentSens.color}`} />
                <span className={`font-display text-sm font-bold ${currentSens.color}`}>{currentSens.label}</span>
              </div>
              <p className="font-body text-sm text-muted-foreground">{currentSens.desc}</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-body text-base glow-cyan gap-2"
        >
          <Save className="h-5 w-5" /> {saving ? "Deploying..." : "Save & Deploy Sentinel"}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Sentinels;

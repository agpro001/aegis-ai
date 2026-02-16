import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, User, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";

const SettingsPage = () => {
  const { user } = useAuth();
  const walletAddress = localStorage.getItem("aegis-wallet");

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-3">
            <SettingsIcon className="h-7 w-7 text-primary" /> Settings
          </h1>
          <p className="font-body text-muted-foreground">Manage your account & preferences</p>
        </div>

        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <User className="h-4 w-4" /> Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 font-body text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email || "Not connected"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wallet</span>
              <span className="font-mono text-xs text-foreground">
                {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-neon-cyan font-semibold">Free Tier</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email alerts on critical threats", defaultChecked: true },
              { label: "In-app toast notifications", defaultChecked: true },
              { label: "Weekly security digest", defaultChecked: false },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="font-body text-sm text-foreground">{item.label}</span>
                <Switch defaultChecked={item.defaultChecked} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

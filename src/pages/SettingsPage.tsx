import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, User, Save, Pencil } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SettingsPage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingWallet, setEditingWallet] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifToast, setNotifToast] = useState(true);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setWalletAddress(data.wallet_address || "");
      setNotifEmail(data.notification_email ?? true);
      setNotifToast(data.notification_toast ?? true);
    }
    setLoading(false);
  };

  const saveField = async (fields: Record<string, any>) => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("user_id", user!.id);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Settings saved");
      setProfile((prev: any) => ({ ...prev, ...fields }));
    }
    setSaving(false);
  };

  const handleToggleEmail = (checked: boolean) => {
    setNotifEmail(checked);
    saveField({ notification_email: checked });
  };

  const handleToggleToast = (checked: boolean) => {
    setNotifToast(checked);
    saveField({ notification_toast: checked });
  };

  const handleSaveName = () => {
    setEditingName(false);
    saveField({ display_name: displayName });
  };

  const handleSaveWallet = () => {
    setEditingWallet(false);
    saveField({ wallet_address: walletAddress });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse font-display text-primary">Loading settings...</span>
        </div>
      </AppLayout>
    );
  }

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
          <CardContent className="space-y-4 font-body text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email</span>
              <span className="text-foreground">{user?.email || "Not connected"}</span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-muted-foreground shrink-0">Display Name</span>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8 w-48 text-sm"
                    placeholder="Enter name"
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={saving} className="h-8 gap-1">
                    <Save className="h-3 w-3" /> Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{displayName || "Not set"}</span>
                  <Button size="icon" variant="ghost" onClick={() => setEditingName(true)} className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-muted-foreground shrink-0">Wallet</span>
              {editingWallet ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="h-8 w-48 text-sm font-mono"
                    placeholder="0x..."
                  />
                  <Button size="sm" onClick={handleSaveWallet} disabled={saving} className="h-8 gap-1">
                    <Save className="h-3 w-3" /> Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-foreground">
                    {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not connected"}
                  </span>
                  <Button size="icon" variant="ghost" onClick={() => setEditingWallet(true)} className="h-6 w-6">
                    <Pencil className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="text-neon-cyan font-semibold">{profile?.plan_tier === "free" ? "Free Tier" : profile?.plan_tier || "Free Tier"}</span>
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
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-foreground">Email alerts on critical threats</span>
              <Switch checked={notifEmail} onCheckedChange={handleToggleEmail} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-body text-sm text-foreground">In-app toast notifications</span>
              <Switch checked={notifToast} onCheckedChange={handleToggleToast} />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;

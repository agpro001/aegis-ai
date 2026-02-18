import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Mail, Lock, Wallet, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Check your email for the confirmation link! After confirming, come back and sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/dashboard");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = async () => {
    try {
      if (!(window as any).ethereum) {
        toast.error("MetaMask not detected. Please install MetaMask.");
        return;
      }
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const message = `Sign in to Aegis-AI\nWallet: ${address}\nTimestamp: ${Date.now()}`;
      const signature = await signer.signMessage(message);

      // For now, store wallet in localStorage and navigate
      // In production, verify signature server-side
      localStorage.setItem("aegis-wallet", address);
      toast.success(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Wallet connection failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background cyber-grid px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <Shield className="mx-auto mb-3 h-12 w-12 text-primary animate-glow-pulse" />
          <h1 className="font-display text-2xl font-bold tracking-wider text-primary text-glow-cyan">
            AEGIS-AI
          </h1>
          <p className="mt-1 font-body text-muted-foreground">
            {mode === "login" ? "Welcome back, Commander" : "Join the Defense Network"}
          </p>
          {mode === "signup" && (
            <p className="mt-2 font-body text-xs text-neon-yellow">
              After creating your account, confirm via email then sign in to access the dashboard.
            </p>
          )}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card/80 p-8 backdrop-blur-sm">
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-background/50 border-border font-body"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-background/50 border-border font-body"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-body text-base glow-cyan"
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="font-body text-xs text-muted-foreground uppercase tracking-wider">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            onClick={handleWalletConnect}
            className="w-full gap-2 border-neon-magenta/30 font-body text-base hover:glow-magenta"
          >
            <Wallet className="h-5 w-5 text-neon-magenta" /> Connect Wallet
          </Button>

          <p className="mt-6 text-center font-body text-sm text-muted-foreground">
            {mode === "login" ? (
              <>
                New to Aegis?{" "}
                <button onClick={() => setMode("signup")} className="text-primary hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

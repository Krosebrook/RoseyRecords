import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { User, Mail, Shield, Bell, Info, Crown, Music, Sparkles, Moon, ChevronRight, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Settings() {
  usePageTitle("Settings");
  const { user, logout } = useAuth();
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("harmoniq_notifications");
    return saved ? JSON.parse(saved) : { likes: true, newSongs: true, updates: false };
  });

  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem("harmoniq_preferences");
    return saved ? JSON.parse(saved) : { hiFi: true, aiHints: true };
  });

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    localStorage.setItem("harmoniq_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("harmoniq_preferences", JSON.stringify(preferences));
  }, [preferences]);

  const toggleDarkMode = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-settings-title">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        <div
          className="rounded-2xl overflow-hidden border border-primary/20 shadow-[0_0_20px_rgba(127,19,236,0.2)]"
          data-testid="card-subscription"
        >
          <div className="h-32 bg-gradient-to-br from-primary/40 via-primary/20 to-background relative flex items-center justify-center">
            <div className="bg-primary/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-primary/50">
              <span className="text-xs font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                Premium Member
              </span>
            </div>
          </div>
          <div className="bg-card p-5">
            <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1">Current Plan</p>
            <p className="text-2xl font-bold mb-3">HarmoniQ Pro</p>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Unlimited AI generations</p>
              <Button size="sm" className="font-bold neon-shadow" data-testid="button-manage-subscription">
                Manage
              </Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 px-1">Preferences</h3>
          <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">High Fidelity Audio</span>
              </div>
              <Switch
                checked={preferences.hiFi}
                onCheckedChange={(checked) => setPreferences({ ...preferences, hiFi: checked })}
                data-testid="switch-hifi"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Enable AI Hints</span>
              </div>
              <Switch
                checked={preferences.aiHints}
                onCheckedChange={(checked) => setPreferences({ ...preferences, aiHints: checked })}
                data-testid="switch-ai-hints"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Moon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">Dark Mode</span>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 px-1">Notifications</h3>
          <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium">Song Likes</span>
                  <p className="text-xs text-muted-foreground">Get notified when someone likes your song</p>
                </div>
              </div>
              <Switch
                checked={notifications.likes}
                onCheckedChange={(checked) => setNotifications({ ...notifications, likes: checked })}
                data-testid="switch-notify-likes"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium">New Community Songs</span>
                  <p className="text-xs text-muted-foreground">Get notified about trending new songs</p>
                </div>
              </div>
              <Switch
                checked={notifications.newSongs}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newSongs: checked })}
                data-testid="switch-notify-songs"
              />
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-sm font-medium">Product Updates</span>
                  <p className="text-xs text-muted-foreground">Receive updates about new features</p>
                </div>
              </div>
              <Switch
                checked={notifications.updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                data-testid="switch-notify-updates"
              />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-3 px-1">Account</h3>
          <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border">
            <div className="flex items-center gap-4 px-4 py-4 justify-between" data-testid="row-account-email">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-account-email">{user?.email || "Not set"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between" data-testid="row-account-profile">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Profile</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-account-name">{user?.firstName} {user?.lastName}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-4 py-4 justify-between" data-testid="row-account-privacy">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-medium">Privacy & Security</p>
              </div>
            </div>
          </div>
        </div>

        <Card data-testid="card-about">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              About
            </CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>2.4.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>HarmoniQ Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Engines</span>
              <span>GPT-5.2, Gemini 3 Pro, Suno, Stable Audio</span>
            </div>
          </CardContent>
        </Card>

        <button
          onClick={() => logout()}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-border text-destructive font-medium hover:bg-destructive/10 transition-colors mb-8"
          data-testid="button-sign-out"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>

        <p className="text-center text-muted-foreground/40 text-xs pb-8">HarmoniQ v2.4.0 (Build 992)</p>
      </div>
    </Layout>
  );
}

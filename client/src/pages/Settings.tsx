import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/use-auth";
import { usePageTitle } from "@/hooks/use-page-title";
import { User, Mail, Calendar, Shield, Palette, Bell, Info } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function Settings() {
  usePageTitle("Settings");
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("harmoniq_notifications");
    return saved ? JSON.parse(saved) : { likes: true, newSongs: true, updates: false };
  });

  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    localStorage.setItem("harmoniq_notifications", JSON.stringify(notifications));
  }, [notifications]);

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

        <Card data-testid="card-profile">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-2 border-border"
                  data-testid="img-profile"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold" data-testid="text-profile-name">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-muted-foreground flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span data-testid="text-member-since">
                  {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Account ID:</span>
                <span className="font-mono text-xs" data-testid="text-account-id">
                  {user?.id?.slice(0, 8)}...
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-appearance">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how HarmoniQ looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme for the interface
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={darkMode}
                onCheckedChange={toggleDarkMode}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-notifications">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
            <CardDescription>Control your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-likes">Song Likes</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone likes your song
                </p>
              </div>
              <Switch
                id="notify-likes"
                checked={notifications.likes}
                onCheckedChange={(checked) => setNotifications({ ...notifications, likes: checked })}
                data-testid="switch-notify-likes"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-songs">New Community Songs</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about trending new songs
                </p>
              </div>
              <Switch
                id="notify-songs"
                checked={notifications.newSongs}
                onCheckedChange={(checked) => setNotifications({ ...notifications, newSongs: checked })}
                data-testid="switch-notify-songs"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notify-updates">Product Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features
                </p>
              </div>
              <Switch
                id="notify-updates"
                checked={notifications.updates}
                onCheckedChange={(checked) => setNotifications({ ...notifications, updates: checked })}
                data-testid="switch-notify-updates"
              />
            </div>
          </CardContent>
        </Card>

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
              <span>1.3.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span>HarmoniQ Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Engines</span>
              <span>OpenAI, Gemini, Stable Audio, Bark</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

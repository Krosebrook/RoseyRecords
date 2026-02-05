import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Music, LayoutDashboard, Mic2, LogOut, User, Compass, Headphones, Activity, ListMusic, Heart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/dashboard", label: "My Library", icon: LayoutDashboard },
    { href: "/generate", label: "Create", icon: Mic2 },
    { href: "/studio", label: "Studio", icon: Headphones },
    { href: "/visualizer", label: "Visualizer", icon: Activity },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/playlists", label: "Playlists", icon: ListMusic },
    { href: "/favorites", label: "Favorites", icon: Heart },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 md:h-screen flex-shrink-0 bg-card border-r border-border flex flex-col z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center neon-shadow">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display" data-testid="text-brand-name">HarmoniQ</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href || 
              (item.href === "/dashboard" && location.startsWith("/songs/")) ||
              (item.href === "/playlists" && location.startsWith("/playlists/"));
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-muted/30 rounded-xl p-4 flex items-center gap-3 mb-3">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-border"
                data-testid="img-user-avatar"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">{user?.firstName || "Artist"}</p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-email">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Link
              href="/settings"
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-lg transition-colors",
                location === "/settings" 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              data-testid="button-settings"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button 
              onClick={() => logout()} 
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[100px] -z-10 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

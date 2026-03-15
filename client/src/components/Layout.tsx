import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Music, LayoutDashboard, Mic2, LogOut, User, Compass, Headphones, Activity, ListMusic, Heart, Settings, ShoppingBag, SlidersHorizontal, Bell, Video, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "My Library", icon: LayoutDashboard },
    { href: "/generate", label: "Create", icon: Mic2 },
    { href: "/studio", label: "Studio", icon: Headphones },
    { href: "/visualizer", label: "Visualizer", icon: Activity },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/mixer", label: "Mixer", icon: SlidersHorizontal },
    { href: "/marketplace", label: "Marketplace", icon: ShoppingBag },
    { href: "/video-creator", label: "Video Creator", icon: Video },
    { href: "/activity", label: "Activity", icon: Bell },
    { href: "/playlists", label: "Playlists", icon: ListMusic },
    { href: "/favorites", label: "Favorites", icon: Heart },
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg" data-testid="link-skip-to-content">
        Skip to content
      </a>
      <header className="md:hidden sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-secondary flex items-center justify-center neon-shadow">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight font-display" data-testid="text-brand-name-mobile">HarmoniQ</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          data-testid="button-mobile-menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 top-[57px] z-20 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          data-testid="overlay-mobile-menu"
        />
      )}

      <aside
        className={cn(
          "fixed top-[57px] left-0 bottom-0 w-72 bg-card border-r border-border flex flex-col z-30 transition-transform duration-300 ease-in-out md:static md:top-0 md:w-64 md:h-screen md:translate-x-0 md:flex-shrink-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="hidden md:flex p-6 items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center neon-shadow">
            <Music className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-display" data-testid="text-brand-name">HarmoniQ</span>
        </div>

        <nav className="flex-1 px-4 py-4 md:py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href ||
              (item.href === "/dashboard" && location.startsWith("/songs/")) ||
              (item.href === "/playlists" && location.startsWith("/playlists/"));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={handleNavClick}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto">
          <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-3 mb-3">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border border-border shrink-0"
                data-testid="img-user-avatar"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-primary" />
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
              onClick={handleNavClick}
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
              className="flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] text-sm text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main id="main-content" className="flex-1 overflow-y-auto relative min-h-0">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 blur-[100px] -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { lazy, Suspense } from "react";

const Landing = lazy(() => import("@/pages/Landing"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Generate = lazy(() => import("@/pages/Generate"));
const SongDetails = lazy(() => import("@/pages/SongDetails"));
const Explore = lazy(() => import("@/pages/Explore"));
const Studio = lazy(() => import("@/pages/Studio"));
const Visualizer = lazy(() => import("@/pages/Visualizer"));
const Playlists = lazy(() => import("@/pages/Playlists"));
const PlaylistDetails = lazy(() => import("@/pages/PlaylistDetails"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Settings = lazy(() => import("@/pages/Settings"));
const Marketplace = lazy(() => import("@/pages/Marketplace"));
const Mixer = lazy(() => import("@/pages/Mixer"));
const Activity = lazy(() => import("@/pages/Activity"));
const VideoCreator = lazy(() => import("@/pages/VideoCreator"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? (
          <Redirect to="/dashboard" />
        ) : (
          <Suspense fallback={<PageLoader />}>
            <Landing />
          </Suspense>
        )}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      
      <Route path="/generate">
        <ProtectedRoute component={Generate} />
      </Route>
      
      <Route path="/songs/:id">
        <ProtectedRoute component={SongDetails} />
      </Route>

      <Route path="/explore">
        <ProtectedRoute component={Explore} />
      </Route>

      <Route path="/studio">
        <ProtectedRoute component={Studio} />
      </Route>

      <Route path="/visualizer">
        <ProtectedRoute component={Visualizer} />
      </Route>

      <Route path="/playlists">
        <ProtectedRoute component={Playlists} />
      </Route>

      <Route path="/playlists/:id">
        <ProtectedRoute component={PlaylistDetails} />
      </Route>

      <Route path="/favorites">
        <ProtectedRoute component={Favorites} />
      </Route>

      <Route path="/settings">
        <ProtectedRoute component={Settings} />
      </Route>

      <Route path="/marketplace">
        <ProtectedRoute component={Marketplace} />
      </Route>

      <Route path="/mixer">
        <ProtectedRoute component={Mixer} />
      </Route>

      <Route path="/activity">
        <ProtectedRoute component={Activity} />
      </Route>

      <Route path="/video-creator">
        <ProtectedRoute component={VideoCreator} />
      </Route>

      <Route>
        <Suspense fallback={<PageLoader />}>
          <NotFound />
        </Suspense>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

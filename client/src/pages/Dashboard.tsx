import Layout from "@/components/Layout";
import { useSongs } from "@/hooks/use-songs";
import { SongCard } from "@/components/SongCard";
import { Plus } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Dashboard() {
  usePageTitle("My Library");
  const { data: songs, isLoading } = useSongs();

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-dashboard-title">My Studio</h1>
            <p className="text-muted-foreground" data-testid="text-dashboard-description">Manage your generated songs and lyrics.</p>
          </div>
          <Link 
            href="/generate" 
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 w-full md:w-auto justify-center"
            data-testid="button-new-project"
          >
            <Plus className="w-5 h-5" />
            New Project
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="container-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : songs && songs.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="container-songs"
          >
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-empty">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No songs yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Your studio is empty. Start generating some lyrics to fill up your portfolio!
            </p>
            <Link href="/generate" className="text-primary hover:underline font-medium" data-testid="link-create-first">
              Create your first song
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

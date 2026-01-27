import Layout from "@/components/Layout";
import { useSongs } from "@/hooks/use-songs";
import { SongCard } from "@/components/SongCard";
import { Plus, Search, Filter, X } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENRES, MOODS } from "@shared/schema";

export default function Dashboard() {
  usePageTitle("My Library");
  const { data: songs, isLoading } = useSongs();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [moodFilter, setMoodFilter] = useState<string>("all");

  const filteredSongs = useMemo(() => {
    if (!songs) return [];
    
    return songs.filter(song => {
      const matchesSearch = searchQuery === "" || 
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.lyrics.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesGenre = genreFilter === "all" || song.genre === genreFilter;
      const matchesMood = moodFilter === "all" || song.mood === moodFilter;
      
      return matchesSearch && matchesGenre && matchesMood;
    });
  }, [songs, searchQuery, genreFilter, moodFilter]);

  const hasActiveFilters = searchQuery !== "" || genreFilter !== "all" || moodFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setGenreFilter("all");
    setMoodFilter("all");
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
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

        <div className="glass-panel rounded-xl p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            
            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-genre">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {GENRES.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={moodFilter} onValueChange={setMoodFilter}>
                <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-mood">
                  <SelectValue placeholder="Mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  {MOODS.map(mood => (
                    <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearFilters}
                  className="shrink-0"
                  data-testid="button-clear-filters"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-3" data-testid="text-filter-count">
              Showing {filteredSongs.length} of {songs?.length || 0} songs
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="container-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : filteredSongs.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="container-songs"
          >
            {filteredSongs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </motion.div>
        ) : songs && songs.length > 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-no-results">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No matching songs</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Try adjusting your search or filters to find what you're looking for.
            </p>
            <Button variant="outline" onClick={clearFilters} data-testid="button-clear-all">
              Clear all filters
            </Button>
          </div>
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

import Layout from "@/components/Layout";
import { usePlaylists, useCreatePlaylist, useDeletePlaylist } from "@/hooks/use-playlists";
import { ListMusic, Plus, Trash2, Music } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { type Playlist } from "@shared/schema";

interface PlaylistCardProps {
  playlist: Playlist;
  onDelete: (e: React.MouseEvent, id: number) => void;
  isDeleting: boolean;
}

const PlaylistCard = memo(function PlaylistCard({ playlist, onDelete, isDeleting }: PlaylistCardProps) {
  return (
    <Link
      href={`/playlists/${playlist.id}`}
      className="block group"
      data-testid={`card-playlist-${playlist.id}`}
    >
      <div className="glass-panel rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.02] hover:border-primary/30 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl group-hover:bg-secondary/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center group-hover:from-secondary group-hover:to-primary transition-all duration-300">
              <ListMusic className="w-6 h-6 text-secondary group-hover:text-white transition-colors" />
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => onDelete(e, playlist.id)}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              data-testid={`button-delete-${playlist.id}`}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>

          <h3 className="text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors" data-testid={`text-playlist-name-${playlist.id}`}>
            {playlist.name}
          </h3>

          {playlist.description && (
            <p className="text-muted-foreground text-sm line-clamp-2 mb-auto">
              {playlist.description}
            </p>
          )}

          <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
            Created {playlist.createdAt ? format(new Date(playlist.createdAt), 'MMM d, yyyy') : 'Unknown'}
          </div>
        </div>
      </div>
    </Link>
  );
});

export default function Playlists() {
  usePageTitle("Playlists");
  const { data: playlists, isLoading } = usePlaylists();
  const { mutate: createPlaylist, isPending: isCreating } = useCreatePlaylist();
  const { mutate: deletePlaylist, isPending: isDeleting } = useDeletePlaylist();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createPlaylist({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setNewName("");
        setNewDescription("");
      }
    });
  };

  const handleDelete = useCallback((e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this playlist?")) {
      deletePlaylist(id);
    }
  }, [deletePlaylist]);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2" data-testid="text-playlists-title">Playlists</h1>
            <p className="text-muted-foreground" data-testid="text-playlists-description">Organize your songs into collections.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full md:w-auto" data-testid="button-new-playlist">
                <Plus className="w-5 h-5 mr-2" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
                <DialogDescription>
                  Give your playlist a name and optional description.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Input
                    placeholder="Playlist name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    data-testid="input-playlist-name"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Description (optional)"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={3}
                    data-testid="input-playlist-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate} 
                  disabled={!newName.trim() || isCreating}
                  data-testid="button-create-playlist"
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="container-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : playlists && playlists.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="container-playlists"
          >
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.id} 
                playlist={playlist}
                onDelete={handleDelete}
                isDeleting={isDeleting}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-card/30 rounded-3xl border border-dashed border-border text-center" data-testid="container-empty">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <ListMusic className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Create playlists to organize your songs into collections.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first">
              <Plus className="w-4 h-4 mr-2" />
              Create your first playlist
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}

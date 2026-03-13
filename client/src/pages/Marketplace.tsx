import { useState } from "react";
import Layout from "@/components/Layout";
import { usePageTitle } from "@/hooks/use-page-title";
import { Search, Download, Star, ShoppingBag, Sparkles, Music, Mic, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SoundPack {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  rating: number;
  downloads: number;
  icon: typeof Music;
  gradient: string;
}

const SOUND_PACKS: SoundPack[] = [
  {
    id: "synthwave-starter",
    name: "Synthwave Starter Pack",
    description: "Retro-futuristic analog sounds & loops.",
    price: 9.99,
    category: "Loops",
    rating: 4.8,
    downloads: 2340,
    icon: Sparkles,
    gradient: "from-purple-600 via-pink-500 to-orange-400",
  },
  {
    id: "lofi-chill",
    name: "Lo-Fi Chill Vibes",
    description: "Relaxing beats, warm textures, and samples.",
    price: 4.99,
    category: "Samples",
    rating: 4.6,
    downloads: 5120,
    icon: Headphones,
    gradient: "from-cyan-500 via-blue-500 to-purple-500",
  },
  {
    id: "trap-hiphop",
    name: "Trap & Hip-Hop Essentials",
    description: "Punchy drums, deep bass, and melodic hooks.",
    price: 7.99,
    category: "Drums",
    rating: 4.9,
    downloads: 8750,
    icon: Music,
    gradient: "from-orange-500 via-red-500 to-pink-500",
  },
  {
    id: "ai-voice-pop",
    name: "AI Voice Models: Pop Diva",
    description: "High-quality female vocal samples and phrases.",
    price: 12.99,
    category: "Vocals",
    rating: 4.7,
    downloads: 1890,
    icon: Mic,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
  },
  {
    id: "cinematic-orchestra",
    name: "Cinematic Orchestra",
    description: "Epic strings, brass, and orchestral hits.",
    price: 14.99,
    category: "Instruments",
    rating: 4.9,
    downloads: 3210,
    icon: Music,
    gradient: "from-amber-500 via-yellow-500 to-orange-400",
  },
  {
    id: "edm-drops",
    name: "EDM Festival Drops",
    description: "Massive buildups, drops, and festival-ready FX.",
    price: 11.99,
    category: "FX",
    rating: 4.5,
    downloads: 4560,
    icon: Sparkles,
    gradient: "from-green-400 via-cyan-500 to-blue-500",
  },
  {
    id: "ambient-textures",
    name: "Ambient Textures Vol. 2",
    description: "Atmospheric pads, drones, and soundscapes.",
    price: 6.99,
    category: "Samples",
    rating: 4.8,
    downloads: 2100,
    icon: Headphones,
    gradient: "from-teal-400 via-emerald-500 to-green-500",
  },
  {
    id: "latin-rhythms",
    name: "Latin Rhythms Collection",
    description: "Reggaeton, salsa, and tropical percussion.",
    price: 8.99,
    category: "Drums",
    rating: 4.7,
    downloads: 3870,
    icon: Music,
    gradient: "from-red-500 via-orange-500 to-yellow-400",
  },
];

const CATEGORIES = ["All", "Loops", "Samples", "Drums", "Vocals", "Instruments", "FX"];

export default function Marketplace() {
  usePageTitle("Sound Marketplace");
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredPacks = SOUND_PACKS.filter((pack) => {
    const matchesSearch =
      pack.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pack.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || pack.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (pack: SoundPack) => {
    toast({
      title: "Coming Soon",
      description: `"${pack.name}" will be available for download soon.`,
    });
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-3" data-testid="text-marketplace-title">
              <ShoppingBag className="w-8 h-8 text-primary" />
              Sound Marketplace
            </h1>
            <p className="text-muted-foreground">Discover premium sound packs and AI voice models</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search Sound Packs & Models"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12"
            data-testid="input-marketplace-search"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
              )}
              data-testid={`button-category-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPacks.map((pack) => (
              <motion.div
                key={pack.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="glass-panel rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/30 transition-all"
                data-testid={`card-pack-${pack.id}`}
              >
                <div className={cn("h-40 bg-gradient-to-br relative overflow-hidden", pack.gradient)}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <pack.icon className="w-16 h-16 text-white/30 group-hover:text-white/50 transition-colors" />
                  </div>
                  <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-medium">{pack.rating}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                    <span className="text-[10px] text-white/80 font-medium uppercase tracking-wider">{pack.category}</span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-sm mb-1 line-clamp-1" data-testid={`text-pack-name-${pack.id}`}>{pack.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{pack.description}</p>
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(pack)}
                      className="text-xs font-bold"
                      data-testid={`button-download-${pack.id}`}
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      ${pack.price.toFixed(2)}
                    </Button>
                    <span className="text-[10px] text-muted-foreground">{pack.downloads.toLocaleString()} downloads</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredPacks.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No sound packs found</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or category filter</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

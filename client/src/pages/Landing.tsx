import { Link } from "wouter";
import { ArrowRight, Music, Sparkles, Mic2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePageTitle } from "@/hooks/use-page-title";

export default function Landing() {
  usePageTitle("AI Music & Lyrics Generator");
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-border/40 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Music className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight font-display" data-testid="text-brand-name">HarmoniQ</span>
          </div>
          <a 
            href="/api/login" 
            className="px-4 md:px-6 py-2 md:py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-sm md:text-base font-medium transition-all backdrop-blur-sm border border-white/5"
            data-testid="button-sign-in"
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center pt-16 md:pt-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/20 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-secondary/10 rounded-full blur-[80px] md:blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 md:mb-8 font-display" data-testid="text-hero-title">
              Create Music with <br />
              <span className="text-gradient">HarmoniQ</span>
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 md:mb-12 px-4 font-light leading-relaxed" data-testid="text-hero-description">
              Your AI-powered music studio. Generate lyrics, instrumentals, and singing vocals — 
              no musical experience required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
              <a 
                href="/api/login" 
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-base md:text-lg transition-all hover:scale-105 neon-shadow flex items-center justify-center gap-2"
                data-testid="button-start-creating"
              >
                Start Creating <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#features" 
                className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 rounded-full bg-card hover:bg-card/80 border border-border text-foreground font-medium text-base md:text-lg transition-all text-center"
                data-testid="link-learn-more"
              >
                Learn More
              </a>
            </div>
          </motion.div>

          {/* Abstract UI representation */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-20 mx-auto max-w-4xl glass-panel rounded-t-3xl border-b-0 p-4 pb-0"
          >
            <div className="rounded-t-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=2574&auto=format&fit=crop" 
                alt="Studio Interface" 
                className="w-full h-auto opacity-80"
                data-testid="img-hero-preview"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-24 bg-card/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-secondary" />}
              title="HarmoniQ Lyrics"
              description="Generate catchy hooks, deep verses, and rhyming bridges instantly. Choose between fast OpenAI or comprehensive Gemini song concepts."
              testId="feature-ai-lyricist"
            />
            <FeatureCard 
              icon={<Mic2 className="w-8 h-8 text-primary" />}
              title="HarmoniQ Vocals"
              description="Transform your lyrics into real singing vocals with AI. Choose from multiple voice styles and hear your words come to life."
              testId="feature-voice-synthesis"
            />
            <FeatureCard 
              icon={<Music className="w-8 h-8 text-accent" />}
              title="HarmoniQ Studio"
              description="Create instrumentals up to 3 minutes long. Mix vocals with beats, download your tracks, and build your sound."
              testId="feature-genre-adaptation"
            />
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border text-center text-muted-foreground text-sm">
        <p data-testid="text-footer">© 2026 HarmoniQ. AI-Powered Music Creation Platform.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, testId }: { icon: React.ReactNode, title: string, description: string, testId: string }) {
  return (
    <div className="p-5 md:p-8 rounded-2xl md:rounded-3xl bg-card border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1" data-testid={testId}>
      <div className="mb-4 md:mb-6 w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-background flex items-center justify-center border border-border">
        {icon}
      </div>
      <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-3">{title}</h3>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

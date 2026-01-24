import { Link } from "wouter";
import { ArrowRight, Music, Sparkles, Mic2 } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-border/40 backdrop-blur-md fixed top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight font-display" data-testid="text-brand-name">HarmoniQ</span>
          </div>
          <a 
            href="/api/login" 
            className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 font-medium transition-all backdrop-blur-sm border border-white/5"
            data-testid="button-sign-in"
          >
            Sign In
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center pt-20 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8 font-display" data-testid="text-hero-title">
              Unleash Your <br />
              <span className="text-gradient">Inner Artist</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 font-light leading-relaxed" data-testid="text-hero-description">
              Generate studio-quality lyrics and songs with the power of advanced AI. 
              No musical experience required.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="/api/login" 
                className="px-8 py-4 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-lg transition-all hover:scale-105 neon-shadow flex items-center gap-2"
                data-testid="button-start-creating"
              >
                Start Creating <ArrowRight className="w-5 h-5" />
              </a>
              <a 
                href="#features" 
                className="px-8 py-4 rounded-full bg-card hover:bg-card/80 border border-border text-foreground font-medium text-lg transition-all"
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
      <section id="features" className="py-24 bg-card/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-secondary" />}
              title="AI Lyricist"
              description="Generate catchy hooks, deep verses, and rhyming bridges instantly based on your mood and topic."
              testId="feature-ai-lyricist"
            />
            <FeatureCard 
              icon={<Mic2 className="w-8 h-8 text-primary" />}
              title="Voice Synthesis"
              description="Turn your lyrics into spoken word or melody sketches with our integrated voice engine."
              testId="feature-voice-synthesis"
            />
            <FeatureCard 
              icon={<Music className="w-8 h-8 text-accent" />}
              title="Genre Adaptation"
              description="From Pop to Punk, Rap to Rock. Our AI adapts the writing style to fit your musical genre perfectly."
              testId="feature-genre-adaptation"
            />
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-border text-center text-muted-foreground text-sm">
        <p data-testid="text-footer">© 2024 HarmoniQ Studio. Powered by Artificial Intelligence.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, testId }: { icon: React.ReactNode, title: string, description: string, testId: string }) {
  return (
    <div className="p-8 rounded-3xl bg-card border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1" data-testid={testId}>
      <div className="mb-6 w-16 h-16 rounded-2xl bg-background flex items-center justify-center border border-border">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

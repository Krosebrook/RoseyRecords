import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sparkles, Music, Mic2, Sliders, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingProps {
  steps: OnboardingStep[];
  storageKey: string;
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function Onboarding({ steps, storageKey, isOpen, onComplete, onSkip }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsVisible(true);
      return;
    }
    
    const hasSeenOnboarding = localStorage.getItem(storageKey);
    if (!hasSeenOnboarding) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [storageKey, isOpen]);

  useEffect(() => {
    if (!isVisible) return;
    
    const step = steps[currentStep];
    if (step?.targetSelector) {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const getTooltipPosition = () => {
    if (!highlightRect || step.position === "center") {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    switch (step.position) {
      case "bottom":
        return {
          position: "fixed" as const,
          top: highlightRect.bottom + padding,
          left: Math.max(padding, Math.min(
            highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case "top":
        return {
          position: "fixed" as const,
          top: highlightRect.top - tooltipHeight - padding,
          left: Math.max(padding, Math.min(
            highlightRect.left + highlightRect.width / 2 - tooltipWidth / 2,
            window.innerWidth - tooltipWidth - padding
          )),
        };
      case "right":
        return {
          position: "fixed" as const,
          top: highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2,
          left: highlightRect.right + padding,
        };
      case "left":
        return {
          position: "fixed" as const,
          top: highlightRect.top + highlightRect.height / 2 - tooltipHeight / 2,
          left: highlightRect.left - tooltipWidth - padding,
        };
      default:
        return {
          position: "fixed" as const,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        data-testid="onboarding-overlay"
      >
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
            style={{
              top: highlightRect.top - 4,
              left: highlightRect.left - 4,
              width: highlightRect.width + 8,
              height: highlightRect.height + 8,
              boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.4)",
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          style={getTooltipPosition()}
          className="w-[360px] max-w-[calc(100vw-32px)]"
          data-testid="onboarding-tooltip"
        >
          <Card className="border-primary/30 bg-card/95 backdrop-blur-md shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    {step.icon || <Sparkles className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg" data-testid="onboarding-step-title">
                      {step.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Step {currentStep + 1} of {steps.length}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSkip}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  data-testid="button-onboarding-skip"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4 leading-relaxed" data-testid="onboarding-step-description">
                {step.description}
              </p>

              <div className="mb-4 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  data-testid="button-onboarding-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                
                <div className="flex gap-1">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        idx === currentStep ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                      data-testid={`onboarding-dot-${idx}`}
                    />
                  ))}
                </div>

                <Button
                  size="sm"
                  onClick={handleNext}
                  data-testid="button-onboarding-next"
                >
                  {currentStep === steps.length - 1 ? "Get Started" : "Next"}
                  {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const STUDIO_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to HarmoniQ Studio",
    description: "This is your creative hub for making music. Let's take a quick tour of what you can do here!",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    position: "center",
  },
  {
    id: "audio-tab",
    title: "Create Instrumentals",
    description: "Use AI to generate unique instrumental tracks. Describe the music you want, pick a genre and mood, then generate a 15-second sample or full track up to 3 minutes.",
    icon: <Music className="w-5 h-5 text-primary" />,
    targetSelector: "[data-testid='tab-audio']",
    position: "bottom",
  },
  {
    id: "vocals-tab",
    title: "AI Singing Vocals",
    description: "Transform your lyrics into actual singing voices! Choose from 10 different AI voice presets and adjust the vocal style to match your song.",
    icon: <Mic2 className="w-5 h-5 text-primary" />,
    targetSelector: "[data-testid='tab-vocals']",
    position: "bottom",
  },
  {
    id: "mix-tab",
    title: "Mix Your Track",
    description: "Combine your instrumental and vocals together. Adjust volume levels and timing to create your final mix, then download the separate files.",
    icon: <Sliders className="w-5 h-5 text-primary" />,
    targetSelector: "[data-testid='tab-mix']",
    position: "bottom",
  },
  {
    id: "theory-tab",
    title: "Music Theory Tools",
    description: "Get AI-powered help with chord progressions, scales, and production tips. Perfect for when you need creative inspiration or want to learn music theory.",
    icon: <BookOpen className="w-5 h-5 text-primary" />,
    targetSelector: "[data-testid='tab-theory']",
    position: "bottom",
  },
];

export const GENERATE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Create Your Lyrics",
    description: "HarmoniQ can write original song lyrics for you using AI. Just describe what you want your song to be about!",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
    position: "center",
  },
  {
    id: "prompt",
    title: "Describe Your Song",
    description: "Tell HarmoniQ what your song should be about. Be as creative as you like - themes, emotions, stories, anything goes!",
    targetSelector: "[data-testid='input-topic']",
    position: "bottom",
  },
  {
    id: "options",
    title: "Set the Mood",
    description: "Choose a genre and mood to guide the AI. These help shape the style and feel of your lyrics.",
    targetSelector: "[data-testid='button-genre-select']",
    position: "bottom",
  },
  {
    id: "generate",
    title: "Generate Your Lyrics",
    description: "Click Generate to create your song! You can choose between OpenAI (fast) or Gemini (more detailed song concepts).",
    targetSelector: "[data-testid='button-generate']",
    position: "top",
  },
];

export function useOnboardingReset() {
  return {
    resetStudioOnboarding: () => localStorage.removeItem("harmoniq-studio-onboarding"),
    resetGenerateOnboarding: () => localStorage.removeItem("harmoniq-generate-onboarding"),
    resetAllOnboarding: () => {
      localStorage.removeItem("harmoniq-studio-onboarding");
      localStorage.removeItem("harmoniq-generate-onboarding");
    },
  };
}

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GenerationResult {
  title: string;
  lyrics: string;
}

export function useChatGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const { toast } = useToast();

  const generateLyrics = async (prompt: string, genre: string, mood: string): Promise<GenerationResult | null> => {
    setIsGenerating(true);
    setCurrentLyrics("");

    try {
      const res = await fetch("/api/generate/lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, genre, mood }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate lyrics");
      }

      const result: GenerationResult = await res.json();
      setCurrentLyrics(result.lyrics);
      
      return result;
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate lyrics. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const getRandomPrompt = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/generate/random-prompt", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to get prompt");
      const data = await res.json();
      return data.prompt;
    } catch (error) {
      return null;
    }
  };

  return {
    generateLyrics,
    getRandomPrompt,
    isGenerating,
    currentLyrics,
    setCurrentLyrics,
  };
}

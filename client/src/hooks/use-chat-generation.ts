import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Integration types for the chat routes
interface Conversation {
  id: number;
  title: string;
}

export function useChatGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const { toast } = useToast();

  const generateLyrics = async (prompt: string, genre: string, mood: string) => {
    setIsGenerating(true);
    setCurrentLyrics("");

    try {
      // 1. Create a conversation for this session
      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Song: ${prompt.slice(0, 20)}...` }),
        credentials: "include",
      });

      if (!convRes.ok) throw new Error("Failed to start generation session");
      const conversation: Conversation = await convRes.json();

      // 2. Construct the prompt
      const fullPrompt = `Write song lyrics about "${prompt}". 
      Genre: ${genre}. 
      Mood: ${mood}. 
      Format: Verse 1, Chorus, Verse 2, Chorus, Bridge, Outro. 
      Do not include any conversational text, just the lyrics.`;

      // 3. Send message and stream response
      const res = await fetch(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fullPrompt }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to generate lyrics");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let generatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                generatedText += data.content;
                setCurrentLyrics((prev) => prev + data.content);
              }
              if (data.done) {
                // Done
              }
              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors for partial chunks
            }
          }
        }
      }

      return generatedText;
    } catch (error) {
      console.error("Generation failed:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate lyrics. Please try again.",
        variant: "destructive",
      });
      return "";
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateLyrics,
    isGenerating,
    currentLyrics,
  };
}

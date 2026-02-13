import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export function useClipboard() {
  const copyToClipboard = useCallback(async (text: string, successMessage = "Copied to clipboard.") => {
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied!", description: successMessage });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("Fallback copy failed");
        }
        toast({ title: "Copied!", description: successMessage });
      }
    } catch (err) {
      toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
    }
  }, []);

  return { copyToClipboard };
}

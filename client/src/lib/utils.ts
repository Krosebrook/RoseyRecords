import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Copy text to clipboard with fallback for older browsers
 * @param text The text to copy to clipboard
 * @param successMessage Optional custom success message (defaults to "Copied to clipboard.")
 */
export async function copyToClipboard(
  text: string,
  successMessage = "Copied to clipboard."
): Promise<void> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: successMessage });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        const successful = document.execCommand("copy");
        if (!successful) {
          throw new Error("Fallback copy failed");
        }
        toast({ title: "Copied!", description: successMessage });
      } finally {
        document.body.removeChild(textArea);
      }
    }
  } catch (err) {
    toast({
      title: "Failed to copy",
      description: "Please try again.",
      variant: "destructive",
    });
  }
}

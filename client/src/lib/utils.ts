import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "@/hooks/use-toast"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Copy text to the clipboard with fallback support for older browsers
 * @param text - The text to copy to clipboard
 * @param successMessage - Optional success message for the toast notification
 */
export async function copyToClipboard(text: string, successMessage = "Copied to clipboard."): Promise<void> {
  if (!text) return;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied!", description: successMessage });
    } else {
      // Fallback for older browsers using deprecated execCommand
      // This is intentionally used for legacy browser support
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast({ title: "Copied!", description: successMessage });
    }
  } catch (err) {
    toast({ title: "Failed to copy", description: "Please try again.", variant: "destructive" });
  }
}

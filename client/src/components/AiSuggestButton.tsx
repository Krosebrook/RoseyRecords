import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AiSuggestButtonProps {
  field: "audio-prompt" | "song-title" | "lyrics" | "topic";
  context?: string;
  onSuggestion: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

export function AiSuggestButton({ field, context, onSuggestion, disabled, className }: AiSuggestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSuggest = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/generate/ai-suggest", {
        field,
        context: context || undefined,
      });
      const data = await response.json();
      if (data.suggestion) {
        onSuggestion(data.suggestion);
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Suggestion failed",
        description: "Could not generate a suggestion right now",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={handleSuggest}
          disabled={disabled || isLoading}
          className={className}
          data-testid={`button-ai-suggest-${field}`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>AI Suggest</p>
      </TooltipContent>
    </Tooltip>
  );
}

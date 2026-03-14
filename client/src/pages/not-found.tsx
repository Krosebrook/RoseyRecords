import { Link } from "wouter";
import { Music, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/use-page-title";

export default function NotFound() {
  usePageTitle("Page Not Found");
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background" data-testid="container-not-found">
      <div className="flex flex-col items-center text-center px-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Music className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2" data-testid="text-404-title">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page doesn't exist. It may have been moved or removed.
        </p>
        <Link href="/">
          <Button size="lg" data-testid="button-go-home">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

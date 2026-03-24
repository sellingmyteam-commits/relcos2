import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-6 p-12 rounded-3xl bg-card border border-white/10 shadow-2xl max-w-md text-center">
        <div className="p-4 bg-destructive/10 rounded-full">
          <AlertTriangle className="w-16 h-16 text-destructive animate-pulse" />
        </div>
        
        <h1 className="text-4xl font-display font-bold text-destructive">
          404 ERROR
        </h1>
        
        <p className="text-muted-foreground text-lg">
          The page you are looking for has been lost in the void.
        </p>

        <Link href="/" className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/10 transition-all w-full">
          RETURN TO BASE
        </Link>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { ExternalLink, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface GameCardProps {
  title: string;
  description?: string;
  url: string;
  gradient: string;
  icon?: React.ReactNode;
}

export function GameCard({ title, description, url, gradient, icon }: GameCardProps) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-card p-1 group shadow-2xl",
        "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-0 before:transition-opacity hover:before:opacity-100",
        gradient
      )}
    >
      <div className="relative z-10 bg-background/90 backdrop-blur-xl h-full rounded-[20px] p-8 flex flex-col items-center justify-center text-center gap-6 border border-white/5">
        {icon && (
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-2 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
        )}
        
        <h2 
          className="text-4xl md:text-5xl font-display font-black tracking-tighter uppercase glitch-text"
          data-text={title}
        >
          {title}
        </h2>
        
        {description && (
          <p className="text-muted-foreground text-lg max-w-md font-medium">
            {description}
          </p>
        )}
        
        <a 
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 group/btn relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-white/10 border-2 border-white/20 rounded-xl hover:bg-white/20 hover:border-white/40 hover:scale-105 active:scale-95 overflow-hidden"
        >
          <span className="mr-2 text-xl">PLAY NOW</span>
          <Play className="w-5 h-5 fill-current" />
          <ExternalLink className="ml-2 w-4 h-4 opacity-50" />
          
          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-20" />
        </a>
      </div>
    </motion.div>
  );
}

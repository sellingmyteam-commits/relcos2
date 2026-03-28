import { useRef, useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SidebarChat } from "@/components/SidebarChat";
import { Loader2, Download, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGameConfig } from "@/lib/gameConfig";
import { downloadGameSave, importGameSave } from "@/lib/saveSystem";

interface GamePageProps {
  src: string;
  title: string;
  gameId?: string;
  banner?: React.ReactNode;
}

type SaveToast = { type: "success" | "error"; message: string } | null;

export function GamePage({ src, title, gameId, banner }: GamePageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [visible, setVisible] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [saveToast, setSaveToast] = useState<SaveToast>(null);

  const gameConfig = gameId ? getGameConfig(gameId) : undefined;

  const showSaveToast = (type: SaveToast["type"], message: string) => {
    setSaveToast({ type, message });
    setTimeout(() => setSaveToast(null), 4000);
  };

  useEffect(() => {
    const handleToggleFullscreen = () => {
      if (containerRef.current) {
        if (!document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen();
        }
      }
    };
    window.addEventListener("toggle-fullscreen", handleToggleFullscreen);
    return () => window.removeEventListener("toggle-fullscreen", handleToggleFullscreen);
  }, []);

  useEffect(() => {
    const totalMs = 4000 + Math.random() * 6000;
    const intervalMs = 80;
    const steps = totalMs / intervalMs;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const raw = step / steps;
      const eased = raw < 0.5
        ? 2 * raw * raw
        : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      setProgress(Math.min(eased * 100, 99));

      if (step >= steps) {
        clearInterval(timer);
        setProgress(100);
        setDone(true);
        setTimeout(() => setVisible(false), 600);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, []);

  const handleExport = async () => {
    if (!gameConfig) return;
    setExporting(true);
    try {
      await downloadGameSave(
        gameConfig.id,
        gameConfig.label,
        gameConfig.lsTerms ?? [],
        gameConfig.idbTerms
      );
      showSaveToast("success", "Save file downloaded!");
    } catch {
      showSaveToast("error", "Failed to export save.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      showSaveToast("error", "Please select a .json save file.");
      return;
    }
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const result = await importGameSave(text);
        if (result.success) {
          showSaveToast("success", `Imported! Reload the game to see your progress.`);
        } else {
          showSaveToast("error", result.error);
        }
      } catch {
        showSaveToast("error", "An unexpected error occurred.");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      showSaveToast("error", "Failed to read the file.");
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <Layout noContainer>
      {banner && (
        <div className="shrink-0">{banner}</div>
      )}

      {gameConfig && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5 bg-black/40 border-b border-white/8 backdrop-blur-sm">
          <span className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mr-1">
            {gameConfig.label}
          </span>

          {saveToast && (
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono border animate-in fade-in duration-150 mr-1",
              saveToast.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              {saveToast.type === "success"
                ? <CheckCircle className="w-3 h-3 shrink-0" />
                : <AlertCircle className="w-3 h-3 shrink-0" />}
              {saveToast.message}
            </div>
          )}

          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={handleExport}
              disabled={exporting}
              data-testid={`button-export-${gameConfig.id}`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-bold font-mono hover:bg-secondary/20 hover:border-secondary/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Download className="w-3 h-3" />}
              {exporting ? "Saving..." : "Export Save"}
            </button>

            <button
              onClick={handleImportClick}
              disabled={importing}
              data-testid={`button-import-${gameConfig.id}`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold font-mono hover:bg-accent/20 hover:border-accent/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Upload className="w-3 h-3" />}
              {importing ? "Loading..." : "Import Save"}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
              data-testid={`input-import-file-${gameConfig.id}`}
            />
          </div>
        </div>
      )}

      <div className={cn(
        "flex overflow-hidden",
        banner && gameConfig ? "h-[calc(100vh-10.5rem)]"
        : banner ? "h-[calc(100vh-8rem)]"
        : gameConfig ? "h-[calc(100vh-7rem)]"
        : "h-[calc(100vh-5rem)]"
      )}>
        <div ref={containerRef} className="flex-1 relative bg-black overflow-hidden">
          <iframe
            src={src}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; keyboard"
            title={title}
            onMouseEnter={(e) => e.currentTarget.focus()}
          />

          {visible && (
            <div
              className={cn(
                "absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 transition-opacity duration-500",
                done ? "opacity-0 pointer-events-none" : "opacity-100",
                "bg-[#080810]"
              )}
            >
              <div className="flex flex-col items-center gap-5 w-full max-w-xs px-6">
                <Loader2 className="w-10 h-10 text-secondary animate-spin" />

                <div className="text-center space-y-1">
                  <p className="text-white font-display font-black text-lg uppercase tracking-widest">
                    {title}
                  </p>
                  <p className="text-muted-foreground text-xs font-mono uppercase tracking-widest">
                    Loading...
                  </p>
                </div>

                <div className="w-full">
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-100 ease-linear shadow-[0_0_8px_theme(colors.secondary.DEFAULT)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-[9px] text-muted-foreground/50 font-mono">INITIALIZING</span>
                    <span className="text-[9px] text-secondary/80 font-mono">{Math.floor(progress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <SidebarChat />
      </div>
    </Layout>
  );
}

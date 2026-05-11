import { useState, useRef, useCallback, useEffect } from "react";
import { X, Play, Upload, Code2, FileCode, RefreshCw, Trash2, AlertTriangle, Maximize2, Minimize2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const SEEN_KEY = "htmlEmulatorSeen";

interface Props {
  onClose: () => void;
}

type InputMode = "paste" | "upload";

function TutorialModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}>
      <div
        className="relative w-full max-w-md rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(10,14,35,0.98) 0%, rgba(2,5,18,0.99) 100%)",
          border: "1px solid rgba(0,255,249,0.2)",
          boxShadow: "0 0 60px rgba(0,255,249,0.08), 0 0 120px rgba(168,85,247,0.06)",
        }}
      >
        {/* Glowing top bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00fff9, #a855f7, #00fff9)" }} />

        <div className="p-6 flex flex-col gap-5">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,249,0.1)", border: "1px solid rgba(0,255,249,0.2)" }}>
              <FileCode className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <div className="font-display font-black text-base tracking-widest text-white uppercase">HTML Emulator</div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Quick-start guide</div>
            </div>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-3">
            {[
              {
                num: "1",
                color: "#00fff9",
                title: "Write or load your HTML",
                desc: 'Use the "Paste Code" tab to type or paste any HTML directly, or switch to "Upload File" to drag and drop (or browse for) a .html file from your device.',
              },
              {
                num: "2",
                color: "#a855f7",
                title: "Press Run",
                desc: 'Hit the glowing Run button in the top bar. Your HTML instantly renders in the live preview panel on the right — scripts, styles, and all.',
              },
              {
                num: "3",
                color: "#f472b6",
                title: "Go fullscreen",
                desc: "Use the fullscreen button (⛶) in the preview bar to expand the output to fill your entire screen. Press Escape or the button again to exit.",
              },
            ].map(({ num, color, title, desc }) => (
              <div key={num} className="flex gap-3 items-start">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5"
                  style={{ background: `${color}18`, border: `1px solid ${color}40`, color }}
                >
                  {num}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{title}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tip */}
          <div className="rounded-lg px-3 py-2.5 flex items-start gap-2 text-xs" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <Info className="w-3.5 h-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
            <span className="text-fuchsia-300/80 leading-relaxed">
              Scripts are sandboxed for safety. Most JavaScript, CSS animations, canvas, and forms work out of the box.
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            data-testid="button-tutorial-got-it"
            className="w-full h-10 rounded-xl font-display font-black text-sm uppercase tracking-widest text-black transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #00fff9 0%, #a855f7 100%)",
              boxShadow: "0 0 20px rgba(0,255,249,0.25)",
            }}
          >
            Got it — let's go!
          </button>
        </div>
      </div>
    </div>
  );
}

export function HtmlEmulator({ onClose }: Props) {
  const [mode, setMode] = useState<InputMode>("paste");
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem(SEEN_KEY));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const dismissTutorial = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setShowTutorial(false);
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await previewContainerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const loadFile = useCallback((file: File) => {
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setError("Only .html and .htm files are supported.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCode(text);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const handleRun = () => {
    if (!code.trim()) {
      setError("Nothing to run — paste or upload some HTML first.");
      return;
    }
    setError(null);
    setSrcDoc(code);
  };

  const handleClear = () => {
    setCode("");
    setFileName(null);
    setSrcDoc(null);
    setError(null);
  };

  return (
    <>
      {showTutorial && <TutorialModal onClose={dismissTutorial} />}

      <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: "rgba(2,5,18,0.97)" }}>
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 h-12 shrink-0 border-b"
          style={{ borderColor: "rgba(0,255,249,0.12)", background: "rgba(0,0,0,0.4)" }}
        >
          <FileCode className="w-4 h-4 text-secondary shrink-0" />
          <span className="font-display font-black text-sm tracking-widest text-white uppercase">
            HTML Emulator
          </span>
          {fileName && (
            <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
              — {fileName}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowTutorial(true)}
              data-testid="button-emulator-help"
              title="How to use"
              className="p-1.5 rounded-md text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              data-testid="button-emulator-clear"
              className="flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-mono font-bold text-muted-foreground hover:text-white hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all uppercase tracking-wider"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
            <button
              onClick={handleRun}
              data-testid="button-emulator-run"
              className="flex items-center gap-1.5 px-4 h-7 rounded-md text-xs font-mono font-black uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #00fff9 0%, #a855f7 100%)",
                color: "#000",
                boxShadow: "0 0 16px rgba(0,255,249,0.3)",
              }}
            >
              <Play className="w-3 h-3 fill-black" />
              Run
            </button>
            <button
              onClick={onClose}
              data-testid="button-emulator-close"
              className="p-1.5 rounded-md text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left — input panel */}
          <div
            className="flex flex-col w-[380px] shrink-0 border-r"
            style={{ borderColor: "rgba(0,255,249,0.1)" }}
          >
            {/* Tabs */}
            <div className="flex border-b shrink-0" style={{ borderColor: "rgba(0,255,249,0.1)" }}>
              {(["paste", "upload"] as InputMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  data-testid={`button-emulator-tab-${m}`}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-9 text-[10px] font-mono font-bold uppercase tracking-widest transition-all",
                    mode === m
                      ? "text-secondary border-b-2 border-secondary bg-secondary/5"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  )}
                >
                  {m === "paste" ? <Code2 className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                  {m === "paste" ? "Paste Code" : "Upload File"}
                </button>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-xs font-mono shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Paste mode */}
            {mode === "paste" && (
              <div className="flex flex-col flex-1 min-h-0 p-3 gap-2">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Paste HTML below, then press Run
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  data-testid="textarea-emulator-code"
                  spellCheck={false}
                  placeholder={"<!DOCTYPE html>\n<html>\n  <body>\n    <h1>Hello world!</h1>\n  </body>\n</html>"}
                  className="flex-1 w-full resize-none rounded-lg border border-white/10 bg-white/5 text-xs font-mono text-white placeholder:text-white/20 focus:outline-none focus:border-secondary/40 focus:bg-secondary/5 p-3 transition-all"
                  style={{ minHeight: 0 }}
                />
              </div>
            )}

            {/* Upload mode */}
            {mode === "upload" && (
              <div className="flex flex-col flex-1 min-h-0 p-3 gap-3">
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Upload an HTML file
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="dropzone-emulator-upload"
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200",
                    dragOver
                      ? "border-secondary bg-secondary/10 scale-[1.01]"
                      : "border-white/15 bg-white/3 hover:border-white/30 hover:bg-white/5"
                  )}
                >
                  <div className={cn("p-3 rounded-full transition-colors", dragOver ? "bg-secondary/20" : "bg-white/5")}>
                    <Upload className={cn("w-6 h-6 transition-colors", dragOver ? "text-secondary" : "text-muted-foreground")} />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-white font-medium">
                      {dragOver ? "Drop to load" : "Drop file here"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">or click to browse</div>
                    <div className="text-[10px] text-muted-foreground/60 font-mono mt-2">.html / .htm</div>
                  </div>
                </div>

                {fileName && code && (
                  <div className="rounded-lg border border-secondary/30 bg-secondary/5 px-3 py-2 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-secondary shrink-0" />
                    <span className="text-xs text-secondary font-mono truncate">{fileName}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground font-mono">
                      {(new TextEncoder().encode(code).length / 1024).toFixed(1)} KB
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  className="hidden"
                  onChange={handleFileChange}
                  data-testid="input-emulator-file"
                />
              </div>
            )}
          </div>

          {/* Right — iframe preview */}
          <div ref={previewContainerRef} className="flex flex-col flex-1 min-w-0">
            {srcDoc ? (
              <>
                <div
                  className="flex items-center gap-2 px-3 h-8 shrink-0 border-b"
                  style={{ borderColor: "rgba(0,255,249,0.1)", background: "rgba(0,0,0,0.2)" }}
                >
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                    Running
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={handleRun}
                      data-testid="button-emulator-rerun"
                      title="Re-run"
                      className="p-1.5 rounded text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      data-testid="button-emulator-fullscreen"
                      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                      className="p-1.5 rounded text-muted-foreground hover:text-secondary hover:bg-secondary/10 transition-colors"
                    >
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <iframe
                  key={srcDoc}
                  srcDoc={srcDoc}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                  title="HTML Emulator Output"
                  data-testid="iframe-emulator-output"
                  className="flex-1 w-full border-none bg-white"
                />
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(0,255,249,0.06)", border: "1px solid rgba(0,255,249,0.12)" }}
                >
                  <Play className="w-7 h-7 text-secondary/60" />
                </div>
                <div>
                  <div className="text-white/60 text-sm font-medium">No output yet</div>
                  <div className="text-white/30 text-xs mt-1 font-mono">
                    Paste or upload HTML, then press{" "}
                    <span className="text-secondary/70">Run</span>
                  </div>
                </div>
                <button
                  onClick={toggleFullscreen}
                  data-testid="button-emulator-fullscreen-empty"
                  title="Fullscreen preview"
                  className="mt-2 flex items-center gap-1.5 px-3 h-7 rounded-md text-xs font-mono text-muted-foreground hover:text-secondary hover:bg-secondary/10 border border-white/10 hover:border-secondary/30 transition-all"
                >
                  <Maximize2 className="w-3 h-3" />
                  Fullscreen
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

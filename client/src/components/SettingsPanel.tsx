import { useState, useRef, useEffect } from "react";
import { X, Download, Upload, Trash2, Volume2, VolumeX, Music, Music2, RotateCcw, CheckCircle, AlertCircle, Info, Loader2, BellOff, Bell, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSettings,
  saveSettings,
  resetAllGameData,
  downloadGameSave,
  importAllGamesSave,
  type GameSettings,
} from "@/lib/saveSystem";

const EAGLERCRAFT_LS_TERMS = ["eaglercraft", "eagler"];
const EAGLERCRAFT_IDB_TERMS = ["eaglercraft", "eagler"];

type Toast = { type: "success" | "error" | "info"; message: string } | null;

interface Props {
  onClose: () => void;
}

export function SettingsPanel({ onClose }: Props) {
  const [settings, setSettings] = useState<GameSettings>(getSettings);
  const [toast, setToast] = useState<Toast>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [eaglercraftDetected, setEaglercraftDetected] = useState<boolean | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkEaglercraftData = () => {
    let found = false;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = (localStorage.key(i) || "").toLowerCase();
        if (EAGLERCRAFT_LS_TERMS.some((t) => k.includes(t))) { found = true; break; }
      }
    } catch {}
    if (!found) {
      try {
        if (indexedDB.databases) {
          indexedDB.databases().then((dbs) => {
            const names = dbs.map((d) => (d.name || "").toLowerCase());
            setEaglercraftDetected(EAGLERCRAFT_IDB_TERMS.some((t) => names.some((n) => n.includes(t))));
          }).catch(() => setEaglercraftDetected(false));
          return;
        }
      } catch {}
    }
    setEaglercraftDetected(found);
  };

  useEffect(() => {
    checkEaglercraftData();
  }, []);

  const showToast = (type: Toast["type"], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const updateSetting = (key: keyof GameSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadGameSave("eaglercraft", "Eaglercraft", EAGLERCRAFT_LS_TERMS, EAGLERCRAFT_IDB_TERMS);
      showToast("success", "eaglercraft-save.json downloaded successfully.");
    } catch {
      showToast("error", "Failed to export Eaglercraft data.");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".json")) {
      showToast("error", "Please select a .json save file.");
      return;
    }
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const result = await importAllGamesSave(text);
        if (result.success) {
          showToast("success", "Eaglercraft data imported. Reload the game to see your worlds.");
          checkEaglercraftData();
        } else {
          showToast("error", result.error);
        }
      } catch {
        showToast("error", "An unexpected error occurred while importing.");
      } finally {
        setImporting(false);
      }
    };
    reader.onerror = () => {
      showToast("error", "Failed to read the file.");
      setImporting(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await resetAllGameData();
      checkEaglercraftData();
      setShowResetConfirm(false);
      showToast("success", "All game data has been reset.");
    } catch {
      showToast("error", "Failed to reset game data.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#0d0d14] border-l border-white/10 flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/5">
          <div>
            <h2 className="text-sm font-display font-black text-white uppercase tracking-widest">Settings</h2>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">RELC.OS System Preferences</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {toast && (
          <div className={cn(
            "mx-4 mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-xs font-mono border animate-in fade-in slide-in-from-top-2 duration-200",
            toast.type === "success" && "bg-green-500/10 border-green-500/30 text-green-400",
            toast.type === "error" && "bg-red-500/10 border-red-500/30 text-red-400",
            toast.type === "info" && "bg-blue-500/10 border-blue-500/30 text-blue-400",
          )}>
            {toast.type === "success" && <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {toast.type === "error" && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {toast.type === "info" && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="leading-relaxed">{toast.message}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Section label="Eaglercraft Data">
            <div className="space-y-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                data-testid="button-export-eaglercraft"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold hover:bg-secondary/20 hover:border-secondary/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                }
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">{exporting ? "Exporting..." : "Export Eaglercraft Data"}</p>
                  <p className="text-[10px] font-normal text-secondary/70 font-mono">Download worlds & settings as eaglercraft-save.json</p>
                </div>
              </button>

              <button
                onClick={handleImportClick}
                disabled={importing}
                data-testid="button-import-eaglercraft"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent/10 border border-accent/20 text-accent text-sm font-bold hover:bg-accent/20 hover:border-accent/40 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                }
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">{importing ? "Importing..." : "Import Eaglercraft Data"}</p>
                  <p className="text-[10px] font-normal text-accent/70 font-mono">Restore worlds from eaglercraft-save.json</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
                data-testid="input-import-file"
              />

              <div className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all",
                eaglercraftDetected === null
                  ? "bg-white/3 border-white/5"
                  : eaglercraftDetected
                    ? "bg-green-500/8 border-green-500/20"
                    : "bg-white/3 border-white/8"
              )}>
                {eaglercraftDetected === null ? (
                  <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
                ) : eaglercraftDetected ? (
                  <Wifi className="w-3.5 h-3.5 text-green-400 shrink-0" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                )}
                <div>
                  <p className={cn(
                    "text-xs font-bold font-mono",
                    eaglercraftDetected ? "text-green-400" : "text-muted-foreground/60"
                  )}>
                    {eaglercraftDetected === null
                      ? "Checking..."
                      : eaglercraftDetected
                        ? "Eaglercraft data detected"
                        : "No Eaglercraft data found"}
                  </p>
                  <p className="text-[9px] text-muted-foreground/40 font-mono mt-0.5">
                    {eaglercraftDetected
                      ? "Worlds and settings are saved in this browser"
                      : "Play Eaglercraft to create save data here"}
                  </p>
                </div>
              </div>
            </div>
          </Section>

          <Section label="Audio">
            <div className="space-y-2">
              <ToggleRow
                icon={settings.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                label="Sound Effects"
                description="Game sounds and SFX"
                value={settings.sound}
                testId="toggle-sound"
                onChange={(v) => updateSetting("sound", v)}
              />
              <ToggleRow
                icon={settings.music ? <Music className="w-4 h-4" /> : <Music2 className="w-4 h-4" />}
                label="Music"
                description="Background music"
                value={settings.music}
                testId="toggle-music"
                onChange={(v) => updateSetting("music", v)}
              />
            </div>
          </Section>

          <Section label="Notifications">
            <div className="space-y-2">
              <ToggleRow
                icon={settings.doNotDisturb ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                label="Do Not Disturb"
                description="Hide all message notifications"
                value={!!settings.doNotDisturb}
                testId="toggle-dnd"
                onChange={(v) => updateSetting("doNotDisturb", v)}
              />
              {settings.doNotDisturb && (
                <div className="px-4 py-2.5 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                  <p className="text-[10px] text-yellow-400/70 font-mono leading-relaxed">
                    DM pop-ups and toast alerts are silenced. You can still view messages in the chat.
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section label="Danger Zone">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                data-testid="button-reset-all"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
              >
                <Trash2 className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold">Reset All Game Data</p>
                  <p className="text-[10px] font-normal text-red-400/60 font-mono">Wipes all progress for every game</p>
                </div>
              </button>
            ) : (
              <div className="space-y-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <p className="text-xs text-red-400 font-bold">This cannot be undone.</p>
                </div>
                <p className="text-[11px] text-red-400/70 font-mono leading-relaxed">
                  All saved progress, scores, and data for every game including Eaglercraft worlds will be permanently deleted.
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={resetting}
                    data-testid="button-cancel-reset"
                    className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-muted-foreground hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    data-testid="button-confirm-reset"
                    className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-xs font-bold text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {resetting
                      ? <><Loader2 className="w-3 h-3 animate-spin" /> RESETTING...</>
                      : <><RotateCcw className="w-3 h-3" /> RESET ALL</>
                    }
                  </button>
                </div>
              </div>
            )}
          </Section>

          <div className="px-5 pb-6 pt-2">
            <p className="text-[9px] text-muted-foreground/40 font-mono text-center leading-relaxed">
              RELC.OS Save System v3.0 · All data stored locally in your browser · Export regularly to keep backups
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-4 border-b border-white/5">
      <p className="text-[9px] font-mono font-bold text-muted-foreground/60 uppercase tracking-widest mb-3">{label}</p>
      {children}
    </div>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  testId,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  testId: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      data-testid={testId}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
        value
          ? "bg-secondary/10 border-secondary/20 text-secondary"
          : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/8 hover:text-white"
      )}
    >
      <span className={value ? "text-secondary" : "text-muted-foreground"}>{icon}</span>
      <div className="flex-1">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] font-mono opacity-60">{description}</p>
      </div>
      <div className={cn(
        "w-9 h-5 rounded-full transition-all duration-300 relative border",
        value ? "bg-secondary/40 border-secondary/50" : "bg-white/10 border-white/15"
      )}>
        <div className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300",
          value ? "left-4 bg-secondary" : "left-0.5 bg-muted-foreground"
        )} />
      </div>
    </button>
  );
}

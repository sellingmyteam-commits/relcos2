const SAVE_VERSION = "1.0";
const SETTINGS_KEY = "relcos_settings";

const SESSION_KEYS = new Set([
  "chatUsername",
  "siteUserId",
  "accessGranted",
]);

export interface GameSettings {
  sound: boolean;
  music: boolean;
  [key: string]: unknown;
}

export interface SaveFile {
  version: string;
  exportedAt: string;
  appName: string;
  settings: GameSettings;
  gameData: Record<string, string>;
  entryCount: number;
}

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { sound: true, music: true, ...parsed };
    }
  } catch {}
  return { sound: true, music: true };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyAudioSettings(settings);
}

export function applyAudioSettings(settings: GameSettings): void {
  try {
    const all = document.querySelectorAll("audio, video") as NodeListOf<HTMLMediaElement>;
    all.forEach((el) => {
      el.muted = !settings.sound;
    });
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe?.contentDocument) {
      const iframeMedia = iframe.contentDocument.querySelectorAll("audio, video") as NodeListOf<HTMLMediaElement>;
      iframeMedia.forEach((el) => {
        el.muted = !settings.sound;
      });
    }
  } catch {}
}

export function exportSave(): SaveFile {
  const settings = getSettings();
  const gameData: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
    const value = localStorage.getItem(key);
    if (value !== null) {
      gameData[key] = value;
    }
  }

  return {
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "RELC.OS",
    settings,
    gameData,
    entryCount: Object.keys(gameData).length,
  };
}

export function downloadSave(): void {
  const save = exportSave();
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relcos-save-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export type ImportResult =
  | { success: true; entriesRestored: number }
  | { success: false; error: string };

export function validateSave(raw: unknown): raw is SaveFile {
  if (!raw || typeof raw !== "object") return false;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== "string") return false;
  if (typeof obj.exportedAt !== "string") return false;
  if (typeof obj.appName !== "string") return false;
  if (!obj.gameData || typeof obj.gameData !== "object") return false;
  if (!obj.settings || typeof obj.settings !== "object") return false;
  const settings = obj.settings as Record<string, unknown>;
  if (typeof settings.sound !== "boolean") return false;
  if (typeof settings.music !== "boolean") return false;
  const gameData = obj.gameData as Record<string, unknown>;
  for (const val of Object.values(gameData)) {
    if (typeof val !== "string") return false;
  }
  return true;
}

export function importSave(jsonText: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON — the file could not be parsed." };
  }

  if (!validateSave(parsed)) {
    return {
      success: false,
      error: "This file doesn't look like a valid RELC.OS save. Make sure you're using an exported save file.",
    };
  }

  const save = parsed as SaveFile;

  if (save.appName !== "RELC.OS") {
    return { success: false, error: "This save file is from a different app." };
  }

  try {
    for (const [key, value] of Object.entries(save.gameData)) {
      if (SESSION_KEYS.has(key)) continue;
      localStorage.setItem(key, value);
    }
    saveSettings(save.settings);
    return { success: true, entriesRestored: Object.keys(save.gameData).length };
  } catch (e) {
    return { success: false, error: "Failed to restore data: " + String(e) };
  }
}

export function resetAllGameData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key)) continue;
    keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
}

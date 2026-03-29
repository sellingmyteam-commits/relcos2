const SAVE_VERSION = "2.0";
const ALL_GAMES_SAVE_VERSION = "3.0";
const SETTINGS_KEY = "relcos_settings";

const SESSION_KEYS = new Set([
  "chatUsername",
  "siteUserId",
  "accessGranted",
]);

export interface GameSettings {
  sound: boolean;
  music: boolean;
  doNotDisturb: boolean;
  [key: string]: unknown;
}

export function getDoNotDisturb(): boolean {
  return getSettings().doNotDisturb === true;
}

interface IDBStoreDump {
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  records: Array<{ key: unknown; value: unknown }>;
}

interface IDBDatabaseDump {
  version: number;
  stores: Record<string, IDBStoreDump>;
}

export interface SaveFile {
  version: string;
  exportedAt: string;
  appName: string;
  settings: GameSettings;
  gameData: Record<string, string>;
  indexedDB: Record<string, IDBDatabaseDump>;
  entryCount: number;
  idbCount: number;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function getSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { sound: true, music: true, doNotDisturb: false, ...JSON.parse(raw) };
  } catch {}
  return { sound: true, music: true, doNotDisturb: false };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  applyAudioSettings(settings);
}

export function applyAudioSettings(settings: GameSettings): void {
  try {
    const all = document.querySelectorAll("audio, video") as NodeListOf<HTMLMediaElement>;
    all.forEach((el) => { el.muted = !settings.sound; });
    const iframe = document.querySelector("iframe") as HTMLIFrameElement | null;
    if (iframe?.contentDocument) {
      const iframeMedia = iframe.contentDocument.querySelectorAll("audio, video") as NodeListOf<HTMLMediaElement>;
      iframeMedia.forEach((el) => { el.muted = !settings.sound; });
    }
  } catch {}
}

// ── Binary serialization helpers ──────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function serializeValue(value: unknown): Promise<unknown> {
  if (value === null || value === undefined) return value;
  if (value instanceof ArrayBuffer) {
    return { __t: "AB", d: arrayBufferToBase64(value) };
  }
  if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
    const tv = value as ArrayBufferView & { constructor: { name: string } };
    return { __t: "TA", k: tv.constructor.name, d: arrayBufferToBase64(tv.buffer as ArrayBuffer) };
  }
  if (value instanceof Blob) {
    const ab = await value.arrayBuffer();
    return { __t: "Blob", m: value.type, d: arrayBufferToBase64(ab) };
  }
  if (Array.isArray(value)) {
    return Promise.all(value.map(serializeValue));
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = await serializeValue(v);
    }
    return result;
  }
  return value;
}

function deserializeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(deserializeValue);
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (obj.__t === "AB") return base64ToArrayBuffer(obj.d as string);
    if (obj.__t === "TA") {
      const buf = base64ToArrayBuffer(obj.d as string);
      const Ctor = (globalThis as Record<string, unknown>)[obj.k as string] as typeof Uint8Array;
      return Ctor ? new Ctor(buf) : buf;
    }
    if (obj.__t === "Blob") {
      const buf = base64ToArrayBuffer(obj.d as string);
      return new Blob([buf], { type: obj.m as string });
    }
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) result[k] = deserializeValue(v);
    return result;
  }
  return value;
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

async function dumpDatabase(name: string): Promise<IDBDatabaseDump | null> {
  return new Promise((resolve) => {
    const openReq = indexedDB.open(name);
    openReq.onerror = () => resolve(null);
    openReq.onsuccess = async () => {
      const db = openReq.result;
      const version = db.version;
      const storeNames = Array.from(db.objectStoreNames);

      if (storeNames.length === 0) {
        db.close();
        resolve({ version, stores: {} });
        return;
      }

      const stores: Record<string, IDBStoreDump> = {};

      try {
        const tx = db.transaction(storeNames, "readonly");

        await Promise.all(
          storeNames.map((storeName) =>
            new Promise<void>((res, rej) => {
              const store = tx.objectStore(storeName);
              const keyPath = store.keyPath;
              const autoIncrement = store.autoIncrement;
              const allKeys: unknown[] = [];
              const allValues: unknown[] = [];
              let keysReady = false;
              let valuesReady = false;

              const finish = async () => {
                if (!keysReady || !valuesReady) return;
                const records: Array<{ key: unknown; value: unknown }> = [];
                for (let i = 0; i < allValues.length; i++) {
                  records.push({
                    key: await serializeValue(allKeys[i]),
                    value: await serializeValue(allValues[i]),
                  });
                }
                stores[storeName] = { keyPath, autoIncrement, records };
                res();
              };

              const kr = store.getAllKeys();
              const vr = store.getAll();
              kr.onsuccess = () => { allKeys.push(...(kr.result as unknown[])); keysReady = true; finish(); };
              vr.onsuccess = () => { allValues.push(...vr.result); valuesReady = true; finish(); };
              kr.onerror = () => rej(kr.error);
              vr.onerror = () => rej(vr.error);
            })
          )
        );

        db.close();
        resolve({ version, stores });
      } catch (e) {
        db.close();
        resolve(null);
      }
    };
  });
}

async function exportIndexedDB(): Promise<Record<string, IDBDatabaseDump>> {
  const result: Record<string, IDBDatabaseDump> = {};
  try {
    if (!indexedDB.databases) return result;
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(async (info) => {
        if (!info.name) return;
        const dump = await dumpDatabase(info.name);
        if (dump && Object.keys(dump.stores).length > 0) {
          result[info.name] = dump;
        }
      })
    );
  } catch {}
  return result;
}

async function restoreDatabase(name: string, dump: IDBDatabaseDump): Promise<void> {
  await new Promise<void>((res, rej) => {
    const del = indexedDB.deleteDatabase(name);
    del.onsuccess = () => res();
    del.onerror = () => rej(del.error);
    del.onblocked = () => res();
  });

  await new Promise<void>((res, rej) => {
    const req = indexedDB.open(name, dump.version);

    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [storeName, storeDump] of Object.entries(dump.stores)) {
        if (db.objectStoreNames.contains(storeName)) db.deleteObjectStore(storeName);
        db.createObjectStore(storeName, {
          keyPath: storeDump.keyPath ?? undefined,
          autoIncrement: storeDump.autoIncrement,
        });
      }
    };

    req.onerror = () => rej(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const storeNames = Object.keys(dump.stores);

      if (storeNames.length === 0) { db.close(); res(); return; }

      try {
        const tx = db.transaction(storeNames, "readwrite");
        tx.oncomplete = () => { db.close(); res(); };
        tx.onerror = () => { db.close(); rej(tx.error); };

        for (const storeName of storeNames) {
          const store = tx.objectStore(storeName);
          const { keyPath, records } = dump.stores[storeName];
          for (const record of records) {
            const val = deserializeValue(record.value);
            if (keyPath) {
              store.put(val);
            } else {
              store.put(val, deserializeValue(record.key) as IDBValidKey);
            }
          }
        }
      } catch (e) {
        db.close();
        rej(e);
      }
    };
  });
}

async function restoreIndexedDB(dump: Record<string, IDBDatabaseDump>): Promise<void> {
  for (const [name, dbDump] of Object.entries(dump)) {
    await restoreDatabase(name, dbDump);
  }
}

async function clearAllIndexedDB(): Promise<void> {
  try {
    if (!indexedDB.databases) return;
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(
        (info) =>
          new Promise<void>((res) => {
            if (!info.name) { res(); return; }
            const req = indexedDB.deleteDatabase(info.name);
            req.onsuccess = () => res();
            req.onerror = () => res();
            req.onblocked = () => res();
          })
      )
    );
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function exportSave(): Promise<SaveFile> {
  const settings = getSettings();
  const gameData: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
    const value = localStorage.getItem(key);
    if (value !== null) gameData[key] = value;
  }

  const idbData = await exportIndexedDB();

  return {
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "RELC.OS",
    settings,
    gameData,
    indexedDB: idbData,
    entryCount: Object.keys(gameData).length,
    idbCount: Object.keys(idbData).length,
  };
}

export async function downloadSave(): Promise<void> {
  const save = await exportSave();
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
  | { success: true; lsCount: number; idbCount: number }
  | { success: false; error: string };

function validateSave(raw: unknown): raw is SaveFile {
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
  return true;
}

export async function importSave(jsonText: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON — the file could not be parsed." };
  }

  if (!validateSave(parsed)) {
    return { success: false, error: "This doesn't look like a valid RELC.OS save file." };
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

    const idbData = save.indexedDB ?? {};
    await restoreIndexedDB(idbData);

    return {
      success: true,
      lsCount: Object.keys(save.gameData).length,
      idbCount: Object.keys(idbData).length,
    };
  } catch (e) {
    return { success: false, error: "Failed to restore data: " + String(e) };
  }
}

export async function resetAllGameData(): Promise<void> {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key)) continue;
    keysToRemove.push(key);
  }
  keysToRemove.forEach((k) => localStorage.removeItem(k));
  await clearAllIndexedDB();
}

// ── All-games unified save API ────────────────────────────────────────────────

export interface GameSection {
  localStorage: Record<string, string>;
  indexedDB: Record<string, IDBDatabaseDump>;
}

export interface AllGamesSave {
  version: string;
  exportedAt: string;
  appName: string;
  settings: GameSettings;
  games: Record<string, GameSection>;
}

function lsKeyMatchesTerms(key: string, terms: string[]): boolean {
  const lower = key.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

function dbNameMatchesTerms(name: string, terms: string[]): boolean {
  const lower = name.toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

export async function exportAllGamesSave(
  gameList: Array<{ id: string; lsTerms?: string[]; idbTerms?: string[] }>
): Promise<AllGamesSave> {
  const settings = getSettings();

  // Collect all IndexedDB databases once
  let allDbs: IDBDatabaseInfo[] = [];
  try {
    if (indexedDB.databases) allDbs = await indexedDB.databases();
  } catch {}

  // Track which ls keys / db names have been claimed by a game
  const claimedLsKeys = new Set<string>();
  const claimedDbNames = new Set<string>();

  const games: Record<string, GameSection> = {};

  for (const game of gameList) {
    const lsTerms = game.lsTerms ?? [];
    const idbTerms = game.idbTerms ?? [];

    const lsData: Record<string, string> = {};
    if (lsTerms.length > 0) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
        if (lsKeyMatchesTerms(key, lsTerms)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            lsData[key] = value;
            claimedLsKeys.add(key);
          }
        }
      }
    }

    const idbData: Record<string, IDBDatabaseDump> = {};
    if (idbTerms.length > 0) {
      await Promise.all(
        allDbs.map(async (info) => {
          if (!info.name) return;
          if (!dbNameMatchesTerms(info.name, idbTerms)) return;
          const dump = await dumpDatabase(info.name);
          if (dump && Object.keys(dump.stores).length > 0) {
            idbData[info.name] = dump;
            claimedDbNames.add(info.name);
          }
        })
      );
    }

    if (Object.keys(lsData).length > 0 || Object.keys(idbData).length > 0) {
      games[game.id] = { localStorage: lsData, indexedDB: idbData };
    }
  }

  // Capture any unclaimed localStorage entries (generic game data)
  const unclaimedLs: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
    if (!claimedLsKeys.has(key)) {
      const value = localStorage.getItem(key);
      if (value !== null) unclaimedLs[key] = value;
    }
  }

  // Capture any unclaimed IndexedDB databases
  const unclaimedIdb: Record<string, IDBDatabaseDump> = {};
  await Promise.all(
    allDbs.map(async (info) => {
      if (!info.name || claimedDbNames.has(info.name)) return;
      const dump = await dumpDatabase(info.name);
      if (dump && Object.keys(dump.stores).length > 0) {
        unclaimedIdb[info.name] = dump;
      }
    })
  );

  if (Object.keys(unclaimedLs).length > 0 || Object.keys(unclaimedIdb).length > 0) {
    games["_other"] = { localStorage: unclaimedLs, indexedDB: unclaimedIdb };
  }

  return {
    version: ALL_GAMES_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "RELC.OS",
    settings,
    games,
  };
}

function triggerDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadAllGamesSave(
  gameList: Array<{ id: string; lsTerms?: string[]; idbTerms?: string[] }>
): Promise<{ gameCount: number }> {
  const save = await exportAllGamesSave(gameList);
  const gameCount = Object.keys(save.games).filter((k) => k !== "_other").length;
  const json = JSON.stringify(save, null, 2);
  triggerDownload(json, `all-games-save-${new Date().toISOString().slice(0, 10)}.json`);
  return { gameCount };
}

function isAllGamesSave(obj: Record<string, unknown>): obj is AllGamesSave {
  return (
    obj.appName === "RELC.OS" &&
    typeof obj.version === "string" &&
    obj.version.startsWith("3") &&
    obj.games !== null &&
    typeof obj.games === "object"
  );
}

function isLegacySave(obj: Record<string, unknown>): obj is SaveFile {
  return (
    obj.appName === "RELC.OS" &&
    typeof obj.gameData === "object" &&
    obj.gameData !== null
  );
}

export async function importAllGamesSave(jsonText: string): Promise<ImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON — the file could not be parsed." };
  }

  if (!parsed || typeof parsed !== "object") {
    return { success: false, error: "This doesn't look like a valid save file." };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.appName !== "RELC.OS") {
    return { success: false, error: "This save file is from a different app." };
  }

  try {
    // Handle new v3 all-games format
    if (isAllGamesSave(obj)) {
      const save = obj as AllGamesSave;
      let lsCount = 0;
      let idbCount = 0;

      for (const section of Object.values(save.games)) {
        for (const [key, value] of Object.entries(section.localStorage)) {
          if (SESSION_KEYS.has(key)) continue;
          localStorage.setItem(key, value);
          lsCount++;
        }
        const idbData = section.indexedDB ?? {};
        await restoreIndexedDB(idbData);
        idbCount += Object.keys(idbData).length;
      }

      if (save.settings) saveSettings(save.settings);

      return { success: true, lsCount, idbCount };
    }

    // Handle legacy v2 flat format
    if (isLegacySave(obj)) {
      const save = obj as SaveFile;
      for (const [key, value] of Object.entries(save.gameData)) {
        if (SESSION_KEYS.has(key)) continue;
        localStorage.setItem(key, value);
      }
      if (save.settings) saveSettings(save.settings);
      const idbData = save.indexedDB ?? {};
      await restoreIndexedDB(idbData);
      return {
        success: true,
        lsCount: Object.keys(save.gameData).length,
        idbCount: Object.keys(idbData).length,
      };
    }

    return { success: false, error: "Unrecognised save file format." };
  } catch (e) {
    return { success: false, error: "Failed to restore data: " + String(e) };
  }
}

export async function downloadGameSave(
  gameId: string,
  gameLabel: string,
  lsTerms: string[],
  idbTerms?: string[]
): Promise<void> {
  const lsData: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
    if (lsTerms.length === 0 || lsKeyMatchesTerms(key, lsTerms)) {
      const value = localStorage.getItem(key);
      if (value !== null) lsData[key] = value;
    }
  }
  const idbData: Record<string, IDBDatabaseDump> = {};
  if (idbTerms && idbTerms.length > 0) {
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        await Promise.all(
          dbs.map(async (info) => {
            if (!info.name || !dbNameMatchesTerms(info.name, idbTerms)) return;
            const dump = await dumpDatabase(info.name);
            if (dump && Object.keys(dump.stores).length > 0) idbData[info.name] = dump;
          })
        );
      }
    } catch {}
  }
  const save: AllGamesSave = {
    version: ALL_GAMES_SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    appName: "RELC.OS",
    settings: getSettings(),
    games: { [gameId]: { localStorage: lsData, indexedDB: idbData } },
  };
  const safeName = gameId.replace(/[^a-z0-9-]/gi, "-");
  triggerDownload(JSON.stringify(save, null, 2), `${safeName}-save-${new Date().toISOString().slice(0, 10)}.json`);
}

export async function getSaveInfo(): Promise<{ lsCount: number; idbCount: number }> {
  let lsCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || SESSION_KEYS.has(key) || key === SETTINGS_KEY) continue;
    lsCount++;
  }
  let idbCount = 0;
  try {
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases();
      idbCount = dbs.length;
    }
  } catch {}
  return { lsCount, idbCount };
}

// ── Cloud Save Sync ────────────────────────────────────────────────────────────

export async function cloudPullSave(userId: number): Promise<ImportResult> {
  try {
    const res = await fetch(`/api/saves/${userId}`);
    if (!res.ok) return { success: false, error: "Failed to fetch cloud save" };
    const { saveData } = await res.json();
    if (!saveData) return { success: true, lsCount: 0, idbCount: 0 };

    const jsonText = typeof saveData === "string" ? saveData : JSON.stringify(saveData);
    return await importAllGamesSave(jsonText);
  } catch (e) {
    return { success: false, error: "Cloud pull failed: " + String(e) };
  }
}

export async function cloudPushSave(userId: number): Promise<void> {
  try {
    const save = await exportAllGamesSave([]);
    await fetch(`/api/saves/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saveData: save }),
    });
  } catch {
    // Silent fail — don't interrupt user experience on push error
  }
}

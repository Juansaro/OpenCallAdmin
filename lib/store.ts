import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeed } from "./seed";
import type { Store } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

let cache: Store | null = null;
let queue: Promise<void> = Promise.resolve();

async function readFromDisk(): Promise<Store | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return null;
  }
}

async function persist(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export async function getStore(): Promise<Store> {
  if (cache) return cache;
  const disk = await readFromDisk();
  cache = disk ?? createSeed();
  if (!disk) {
    await persist(cache);
  }
  return cache;
}

export async function updateStore<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  let result!: T;
  const run = queue.then(async () => {
    const store = await getStore();
    result = await fn(store);
    cache = store;
    await persist(store);
  });
  queue = run.catch(() => undefined);
  await run;
  return result;
}

export async function resetStore(): Promise<Store> {
  return updateStore((store) => {
    const fresh = createSeed();
    Object.assign(store, fresh);
    return store;
  });
}

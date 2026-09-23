import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Plant, Photo, Watering } from "./types";

interface AgaveDB extends DBSchema {
  plants: { key: string; value: Plant };
  photos: {
    key: string;
    value: Photo;
    indexes: { plantId: string };
  };
  waterings: {
    key: string;
    value: Watering;
    indexes: { plantId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<AgaveDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AgaveDB>("agave-days", 1, {
      upgrade(db) {
        db.createObjectStore("plants", { keyPath: "id" });
        const photos = db.createObjectStore("photos", { keyPath: "id" });
        photos.createIndex("plantId", "plantId");
        const waterings = db.createObjectStore("waterings", { keyPath: "id" });
        waterings.createIndex("plantId", "plantId");
      },
    });
  }
  return dbPromise;
}

const newId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// ---- Plants ----

export async function addPlant(input: {
  name: string;
  species?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  purchasePlace?: string;
  memo?: string;
}): Promise<Plant> {
  const db = await getDB();
  const plant: Plant = {
    id: newId(),
    ...input,
    createdAt: now(),
    updatedAt: now(),
  };
  await db.put("plants", plant);
  return plant;
}

export async function listPlants(): Promise<Plant[]> {
  const db = await getDB();
  const all = await db.getAll("plants");
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getPlant(id: string): Promise<Plant | undefined> {
  const db = await getDB();
  return db.get("plants", id);
}

export async function updatePlant(id: string, patch: Partial<Plant>): Promise<void> {
  const db = await getDB();
  const existing = await db.get("plants", id);
  if (!existing) return;
  await db.put("plants", { ...existing, ...patch, updatedAt: now() });
}

// ---- Photos ----

export async function makeThumbnail(blob: Blob, maxSize = 320): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b ?? blob), "image/jpeg", 0.82);
  });
}

export async function addPhoto(input: {
  plantId: string;
  takenAt?: string;
  original: Blob;
  memo?: string;
}): Promise<Photo> {
  const db = await getDB();
  const thumbnail = await makeThumbnail(input.original);
  const photo: Photo = {
    id: newId(),
    plantId: input.plantId,
    takenAt: input.takenAt ?? now(),
    original: input.original,
    thumbnail,
    memo: input.memo,
    createdAt: now(),
  };
  await db.put("photos", photo);
  return photo;
}

export async function listPhotosForPlant(plantId: string): Promise<Photo[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("photos", "plantId", plantId);
  return all.sort((a, b) => a.takenAt.localeCompare(b.takenAt));
}

export async function getLatestPhoto(plantId: string): Promise<Photo | undefined> {
  const photos = await listPhotosForPlant(plantId);
  return photos.at(-1);
}

// ---- Waterings ----

export async function addWatering(input: {
  plantId: string;
  wateredAt?: string;
  memo?: string;
}): Promise<Watering> {
  const db = await getDB();
  const watering: Watering = {
    id: newId(),
    plantId: input.plantId,
    wateredAt: input.wateredAt ?? now(),
    memo: input.memo,
    createdAt: now(),
  };
  await db.put("waterings", watering);
  return watering;
}

export async function listWateringsForPlant(plantId: string): Promise<Watering[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex("waterings", "plantId", plantId);
  return all.sort((a, b) => b.wateredAt.localeCompare(a.wateredAt));
}

export async function getLatestWatering(plantId: string): Promise<Watering | undefined> {
  const all = await listWateringsForPlant(plantId);
  return all[0];
}

// ---- Backup ----

export async function getAllData() {
  const db = await getDB();
  const [plants, photos, waterings] = await Promise.all([
    db.getAll("plants"),
    db.getAll("photos"),
    db.getAll("waterings"),
  ]);
  return { plants, photos, waterings };
}

export async function restoreAllData(data: {
  plants: Plant[];
  photos: Photo[];
  waterings: Watering[];
}) {
  const db = await getDB();
  const tx = db.transaction(["plants", "photos", "waterings"], "readwrite");
  for (const p of data.plants) await tx.objectStore("plants").put(p);
  for (const p of data.photos) await tx.objectStore("photos").put(p);
  for (const w of data.waterings) await tx.objectStore("waterings").put(w);
  await tx.done;
}

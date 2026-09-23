import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import JSZip from "jszip";
import { getAllData, restoreAllData, makeThumbnail } from "../db";
import type { Plant, Photo, Watering } from "../types";
import { BackIcon } from "../components/Icons";

function todayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function Settings() {
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    setBusy("export");
    setMessage(null);
    try {
      const { plants, photos, waterings } = await getAllData();
      const zip = new JSZip();

      zip.file(
        "data/plants.json",
        JSON.stringify(plants, null, 2)
      );
      zip.file(
        "data/watering.json",
        JSON.stringify(waterings, null, 2)
      );
      zip.file(
        "data/photos.json",
        JSON.stringify(
          photos.map((p) => ({
            id: p.id,
            plantId: p.plantId,
            takenAt: p.takenAt,
            memo: p.memo,
            createdAt: p.createdAt,
            file: `photos/${p.id}.jpg`,
          })),
          null,
          2
        )
      );
      for (const photo of photos) {
        zip.file(`photos/${photo.id}.jpg`, photo.original);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agave-days-backup-${todayStamp()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage(`バックアップを書き出しました(株${plants.length}件・写真${photos.length}枚)。`);
    } catch {
      setMessage("バックアップの書き出しに失敗しました。");
    } finally {
      setBusy(null);
    }
  }

  async function handleImportFile(file: File | null) {
    if (!file) return;
    setBusy("import");
    setMessage(null);
    try {
      const zip = await JSZip.loadAsync(file);

      const plantsJson = await zip.file("data/plants.json")?.async("string");
      const wateringJson = await zip.file("data/watering.json")?.async("string");
      const photosJson = await zip.file("data/photos.json")?.async("string");
      if (!plantsJson || !wateringJson || !photosJson) {
        throw new Error("invalid backup file");
      }

      const plants: Plant[] = JSON.parse(plantsJson);
      const waterings: Watering[] = JSON.parse(wateringJson);
      const photoMeta: Array<Omit<Photo, "original" | "thumbnail"> & { file: string }> = JSON.parse(photosJson);

      const photos: Photo[] = [];
      for (const meta of photoMeta) {
        const entry = zip.file(meta.file);
        if (!entry) continue;
        const original = await entry.async("blob");
        const thumbnail = await makeThumbnail(original);
        photos.push({
          id: meta.id,
          plantId: meta.plantId,
          takenAt: meta.takenAt,
          memo: meta.memo,
          createdAt: meta.createdAt,
          original,
          thumbnail,
        });
      }

      await restoreAllData({ plants, photos, waterings });
      setMessage(`バックアップを読み込みました(株${plants.length}件・写真${photos.length}枚)。`);
    } catch {
      setMessage("バックアップの読み込みに失敗しました。ファイルを確認してください。");
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to="/" aria-label="ホームに戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>設定</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "10px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>バックアップ</div>

        <button
          type="button"
          onClick={handleExport}
          disabled={busy !== null}
          style={{ textAlign: "center", background: "var(--clay)", color: "#fff", fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 16, border: "none", cursor: "pointer", opacity: busy ? 0.6 : 1 }}
        >
          {busy === "export" ? "書き出し中…" : "バックアップを書き出す"}
        </button>

        <label
          style={{ textAlign: "center", background: "var(--surface)", border: "1.5px solid var(--sage)", color: "var(--sage-dark)", fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 16, cursor: "pointer", opacity: busy ? 0.6 : 1 }}
        >
          {busy === "import" ? "読み込み中…" : "バックアップを読み込む"}
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            style={{ display: "none" }}
            disabled={busy !== null}
            onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {message && <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>{message}</div>}

        <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7, marginTop: 8 }}>
          株情報・水やり履歴・撮影写真をZIPファイルとして書き出します。iPhoneとPCの間でデータを移すときはこのファイルを使ってください。
        </div>
      </div>
    </div>
  );
}

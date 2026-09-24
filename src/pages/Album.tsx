import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlant, listPhotosForPlant } from "../db";
import type { Photo, Plant } from "../types";
import { BackIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtLong } from "../utils/date";

interface MonthGroup {
  key: string;
  label: string;
  photos: Photo[];
}

function groupByMonth(photos: Photo[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();
  for (const p of photos) {
    const d = new Date(p.takenAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) {
      map.set(key, { key, label: `${d.getFullYear()}年${d.getMonth() + 1}月`, photos: [] });
    }
    map.get(key)!.photos.push(p);
  }
  // Newest month first; within a month, oldest photo first (reads as "how it grew this month").
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key, undefined, { numeric: true }));
}

export function Album() {
  const { id = "" } = useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
    listPhotosForPlant(id).then(setPhotos);
  }, [id]);

  const groups = useMemo(() => groupByMonth(photos), [photos]);
  const firstPhotoId = photos[0]?.id;

  const selectedIndex = photos.findIndex((p) => p.id === selectedId);
  const selected = selectedIndex >= 0 ? photos[selectedIndex] : null;

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to={`/plant/${id}`} aria-label="株詳細に戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plant ? `${plant.name}のアルバム` : "成長アルバム"}</div>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>{photos.length > 0 ? `写真 ${photos.length}枚` : "撮影したすべての写真"}</div>
        </div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column", gap: 22 }}>
        {photos.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 14, padding: "40px 4px", textAlign: "center" }}>まだ写真がありません。撮影するとここに並びます。</div>
        )}

        {groups.map((group) => (
          <div key={group.key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{group.label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {group.photos.map((p) => (
                <Tile key={p.id} photo={p} isFirst={p.id === firstPhotoId} onClick={() => setSelectedId(p.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <Lightbox
          photo={selected}
          hasPrev={selectedIndex > 0}
          hasNext={selectedIndex < photos.length - 1}
          onPrev={() => setSelectedId(photos[selectedIndex - 1].id)}
          onNext={() => setSelectedId(photos[selectedIndex + 1].id)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function Tile({ photo, isFirst, onClick }: { photo: Photo; isFirst: boolean; onClick: () => void }) {
  const url = useObjectUrl(photo.thumbnail);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        aspectRatio: "1 / 1",
        borderRadius: 10,
        overflow: "hidden",
        border: "none",
        padding: 0,
        cursor: "pointer",
        backgroundColor: "#EDE6D3",
        backgroundImage: url ? `url("${url}")` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {isFirst && (
        <span
          style={{
            position: "absolute",
            left: 5,
            bottom: 5,
            background: "rgba(20,18,13,0.65)",
            color: "#fff",
            fontSize: 9,
            fontWeight: 700,
            padding: "2px 6px",
            borderRadius: 100,
          }}
        >
          最初の記録
        </span>
      )}
    </button>
  );
}

function Lightbox({
  photo,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  photo: Photo;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const url = useObjectUrl(photo.original);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,13,9,0.94)",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      onClick={onClose}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 0" }}>
        <span style={{ color: "#EDE7D8", fontSize: 13 }}>{fmtLong(photo.takenAt)}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: 16 }}>
        {url && (
          <img
            src={url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 12 }}
          />
        )}
        {hasPrev && (
          <NavButton side="left" onClick={onPrev} />
        )}
        {hasNext && (
          <NavButton side="right" onClick={onNext} />
        )}
      </div>
    </div>
  );
}

function NavButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "前の写真" : "次の写真"}
      style={{
        position: "absolute",
        top: "50%",
        [side]: 8,
        transform: "translateY(-50%)",
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d={side === "left" ? "M15 18l-6-6 6-6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

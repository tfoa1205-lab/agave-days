import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlant, listPhotosForPlant } from "../db";
import type { Photo, Plant } from "../types";
import { BackIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtLong } from "../utils/date";

interface Milestone {
  label: string;
  photo: Photo;
}

const OFFSETS: Array<{ label: string; days: number }> = [
  { label: "購入時", days: 0 },
  { label: "30日", days: 30 },
  { label: "60日", days: 60 },
  { label: "90日", days: 90 },
];

function buildMilestones(photos: Photo[], baseDate: Date | null): Milestone[] {
  if (photos.length === 0) return [];
  const base = baseDate ?? new Date(photos[0].takenAt);
  const now = Date.now();
  const results: Milestone[] = [];
  let lastId: string | null = null;

  for (const { label, days } of OFFSETS) {
    const targetTime = base.getTime() + days * 86400000;
    if (targetTime > now) break;
    let nearest = photos[0];
    let bestDiff = Infinity;
    for (const p of photos) {
      const diff = Math.abs(new Date(p.takenAt).getTime() - targetTime);
      if (diff < bestDiff) {
        bestDiff = diff;
        nearest = p;
      }
    }
    if (nearest.id !== lastId) {
      results.push({ label, photo: nearest });
      lastId = nearest.id;
    }
  }

  const latest = photos.at(-1)!;
  if (latest.id === lastId) {
    results[results.length - 1] = { label: "現在", photo: latest };
  } else {
    results.push({ label: "現在", photo: latest });
  }
  return results;
}

export function Album() {
  const { id = "" } = useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
    listPhotosForPlant(id).then(setPhotos);
  }, [id]);

  const baseDate = plant?.purchaseDate ? new Date(plant.purchaseDate) : null;
  const milestones = buildMilestones(photos, baseDate);

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to={`/plant/${id}`} aria-label="株詳細に戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plant ? `${plant.name}の成長アルバム` : "成長アルバム"}</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column" }}>
        {milestones.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 14, padding: "40px 4px", textAlign: "center" }}>まだ写真がありません。撮影するとここに成長の記録が並びます。</div>
        )}

        {milestones.map((m, i) => (
          <MilestoneCard key={`${m.label}-${m.photo.id}`} milestone={m} isLast={i === milestones.length - 1} />
        ))}
      </div>
    </div>
  );
}

function MilestoneCard({ milestone, isLast }: { milestone: Milestone; isLast: boolean }) {
  const url = useObjectUrl(milestone.photo.original);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          alignSelf: "stretch",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 20,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            aspectRatio: "1 / 1",
            backgroundColor: url ? "#000" : undefined,
            backgroundImage: url ? `url("${url}")` : "linear-gradient(180deg, #F1ECDC 0%, #E8E0CB 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="serif" style={{ fontWeight: 700, fontSize: 15, color: "var(--clay)" }}>{milestone.label}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{fmtLong(milestone.photo.takenAt)}</span>
        </div>
      </div>
      {!isLast && (
        <div style={{ padding: "6px 0" }}>
          <svg width="14" height="24" viewBox="0 0 14 24" fill="none" stroke="var(--line)" strokeWidth={2}>
            <path d="M7 0v18M2 14l5 6 5-6" stroke="#C9BFA4" />
          </svg>
        </div>
      )}
    </div>
  );
}

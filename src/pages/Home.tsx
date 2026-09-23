import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPlants, getLatestPhoto, getLatestWatering } from "../db";
import type { Plant, Photo, Watering } from "../types";
import { PetalGlyph } from "../components/PetalGlyph";
import { CameraIcon, DropIcon, PlusIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtShort, daysSince, todayLongJa } from "../utils/date";

interface Row {
  plant: Plant;
  photo?: Photo;
  watering?: Watering;
}

export function Home() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const plants = await listPlants();
      const rows = await Promise.all(
        plants.map(async (plant) => ({
          plant,
          photo: await getLatestPhoto(plant.id),
          watering: await getLatestWatering(plant.id),
        }))
      );
      if (!cancelled) setRows(rows.reverse());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <div style={{ padding: "30px 22px 6px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div className="serif" style={{ fontWeight: 700, fontSize: 25, letterSpacing: "0.03em" }}>
            AGAVE DAYS
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{todayLongJa()}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Link
          to="/calendar"
          aria-label="カレンダー"
          style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </Link>
        <Link
          to="/settings"
          aria-label="設定"
          style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
        </div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "14px 20px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
        {rows === null && <div style={{ color: "var(--muted)", fontSize: 14, padding: "20px 4px" }}>読み込み中…</div>}

        {rows?.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 14, padding: "20px 4px", lineHeight: 1.7 }}>
            まだ株が登録されていません。
            <br />
            下のボタンから最初の株を登録しましょう。
          </div>
        )}

        {rows?.map((row) => (
          <PlantCard key={row.plant.id} {...row} />
        ))}

        <Link
          to="/add"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "1.5px dashed #C9BFA4",
            borderRadius: 22,
            padding: 20,
            color: "var(--clay-soft-ink)",
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          <PlusIcon />
          <span>株を追加</span>
        </Link>
      </div>
    </div>
  );
}

function PlantCard({ plant, photo, watering }: Row) {
  const photoUrl = useObjectUrl(photo?.thumbnail);
  const days = watering ? daysSince(watering.wateredAt) : undefined;

  return (
    <Link
      to={`/plant/${plant.id}`}
      style={{
        display: "block",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(42,38,32,0.05)",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          background: photoUrl ? "#000" : "linear-gradient(180deg, #F1ECDC 0%, #E8E0CB 100%)",
          backgroundImage: photoUrl ? `url("${photoUrl}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!photoUrl && <PetalGlyph size={110} />}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "flex-end",
            padding: "14px 16px",
            background: "linear-gradient(180deg, rgba(20,18,13,0) 42%, rgba(20,18,13,0.60) 100%)",
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span className="serif" style={{ fontWeight: 700, fontSize: 19, color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
              {plant.name}
            </span>
            {days !== undefined && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.94)",
                  color: days <= 5 ? "var(--sage-dark)" : "var(--clay-soft-ink)",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "5px 11px",
                  borderRadius: 100,
                }}
              >
                水やりから{days}日
              </span>
            )}
          </div>
        </div>
      </div>
      <div style={{ padding: "13px 18px 16px", display: "flex", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          <CameraIcon />
          <span>{photo ? `撮影 ${fmtShort(photo.takenAt)}` : "撮影 まだなし"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-soft)" }}>
          <DropIcon />
          <span>{watering ? `水やり ${fmtShort(watering.wateredAt)}` : "水やり まだなし"}</span>
        </div>
      </div>
    </Link>
  );
}

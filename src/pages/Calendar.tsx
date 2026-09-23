import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getAllData } from "../db";
import type { Photo, Plant, Watering } from "../types";
import { BackIcon, CameraIcon, DropIcon, ChevronRightIcon } from "../components/Icons";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function CalendarPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [waterings, setWaterings] = useState<Watering[]>([]);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    getAllData().then((d) => {
      setPlants(d.plants);
      setPhotos(d.photos);
      setWaterings(d.waterings);
    });
  }, []);

  const plantName = useMemo(() => {
    const map = new Map(plants.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? "?";
  }, [plants]);

  const photosByDay = useMemo(() => {
    const m = new Map<string, Photo[]>();
    for (const p of photos) {
      const k = dateKey(p.takenAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(p);
    }
    return m;
  }, [photos]);

  const wateringsByDay = useMemo(() => {
    const m = new Map<string, Watering[]>();
    for (const w of waterings) {
      const k = dateKey(w.wateredAt);
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(w);
    }
    return m;
  }, [waterings]);

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstWeekday = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const todayKey = dateKey(new Date().toISOString());

  const cells: Array<{ day: number; key: string } | null> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, key: `${year}-${monthIndex}-${day}` });

  const selectedPhotos = selectedKey ? photosByDay.get(selectedKey) ?? [] : [];
  const selectedWaterings = selectedKey ? wateringsByDay.get(selectedKey) ?? [] : [];

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to="/" aria-label="ホームに戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>カレンダー</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => setMonth(new Date(year, monthIndex - 1, 1))}
            style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", cursor: "pointer", transform: "rotate(180deg)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronRightIcon size={14} />
          </button>
          <div className="serif" style={{ fontWeight: 700, fontSize: 17 }}>{year}年{monthIndex + 1}月</div>
          <button
            type="button"
            onClick={() => setMonth(new Date(year, monthIndex + 1, 1))}
            style={{ width: 32, height: 32, borderRadius: 10, background: "var(--surface)", border: "1px solid var(--line)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {WEEKDAYS.map((w) => (
            <div key={w} style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", fontWeight: 600, padding: "2px 0" }}>{w}</div>
          ))}
          {cells.map((cell, i) => {
            if (!cell) return <div key={`blank-${i}`} />;
            const hasPhoto = photosByDay.has(cell.key);
            const hasWatering = wateringsByDay.has(cell.key);
            const isToday = cell.key === todayKey;
            const isSelected = cell.key === selectedKey;
            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => setSelectedKey(isSelected ? null : cell.key)}
                style={{
                  aspectRatio: "1 / 1",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  borderRadius: 12,
                  border: isSelected ? "1.5px solid var(--clay)" : isToday ? "1.5px solid var(--sage)" : "1px solid transparent",
                  background: isSelected ? "var(--clay-soft)" : "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? "var(--sage-dark)" : "var(--ink)" }}>{cell.day}</span>
                <span style={{ display: "flex", gap: 2 }}>
                  {hasPhoto && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--clay)", display: "inline-block" }} />}
                  {hasWatering && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sage)", display: "inline-block" }} />}
                </span>
              </button>
            );
          })}
        </div>

        {selectedKey && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>この日の記録</div>
            {selectedPhotos.length === 0 && selectedWaterings.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--muted)" }}>記録はありません。</div>
            )}
            {selectedPhotos.map((p) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px" }}>
                <CameraIcon size={15} color="var(--clay)" />
                <span style={{ fontSize: 14 }}>{plantName(p.plantId)}</span>
              </div>
            ))}
            {selectedWaterings.map((w) => (
              <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "10px 14px" }}>
                <DropIcon size={15} color="var(--sage)" />
                <span style={{ fontSize: 14 }}>{plantName(w.plantId)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

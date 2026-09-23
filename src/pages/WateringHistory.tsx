import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlant, listWateringsForPlant } from "../db";
import type { Plant, Watering } from "../types";
import { BackIcon, DropIcon } from "../components/Icons";
import { fmtLong } from "../utils/date";

export function WateringHistory() {
  const { id = "" } = useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [waterings, setWaterings] = useState<Watering[]>([]);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
    listWateringsForPlant(id).then(setWaterings);
  }, [id]);

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to={`/plant/${id}`} aria-label="株詳細に戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plant ? `${plant.name}の水やり履歴` : "水やり履歴"}</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
        {waterings.length === 0 && <div style={{ color: "var(--muted)", fontSize: 14, padding: "20px 4px" }}>まだ水やりの記録がありません。</div>}
        {waterings.map((w) => (
          <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: "13px 16px" }}>
            <DropIcon size={16} color="var(--sage)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{fmtLong(w.wateredAt)}</span>
            {w.memo && <span style={{ fontSize: 13, color: "var(--muted)" }}>{w.memo}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getPlant, getLatestPhoto, getLatestWatering, addWatering, updatePlant } from "../db";
import type { Plant, Photo, Watering } from "../types";
import { PetalGlyph } from "../components/PetalGlyph";
import { BackIcon, CameraIcon, DropIcon, ChevronRightIcon, PlayIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtLong } from "../utils/date";

export function PlantDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [photo, setPhoto] = useState<Photo | undefined>();
  const [watering, setWatering] = useState<Watering | undefined>();
  const [memo, setMemo] = useState("");
  const [watering_busy, setWateringBusy] = useState(false);
  const photoUrl = useObjectUrl(photo?.original);

  const load = useCallback(async () => {
    const p = await getPlant(id);
    setPlant(p ?? null);
    setMemo(p?.memo ?? "");
    setPhoto(await getLatestPhoto(id));
    setWatering(await getLatestWatering(id));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleWater() {
    if (watering_busy) return;
    setWateringBusy(true);
    try {
      await addWatering({ plantId: id });
      setWatering(await getLatestWatering(id));
    } finally {
      setWateringBusy(false);
    }
  }

  async function handleMemoBlur() {
    if (!plant || memo === (plant.memo ?? "")) return;
    await updatePlant(id, { memo: memo || undefined });
  }

  if (plant === undefined) return null;
  if (plant === null) {
    return (
      <div className="app-shell" style={{ padding: 24 }}>
        <p>株が見つかりませんでした。</p>
        <button onClick={() => navigate("/")}>ホームに戻る</button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to="/" aria-label="ホームに戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plant.name}</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "8px 20px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            borderRadius: 24,
            overflow: "hidden",
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
          {!photoUrl && <PetalGlyph size={190} />}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="serif" style={{ fontWeight: 700, fontSize: 24 }}>{plant.name}</div>
          {plant.species && <div style={{ fontSize: 14, fontStyle: "italic", color: "var(--muted)" }}>{plant.species}</div>}
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
              <DropIcon size={14} color="var(--sage)" />
              <span>最終水やり</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{watering ? fmtLong(watering.wateredAt) : "まだなし"}</div>
          </div>
          <div style={{ flex: 1, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
              <CameraIcon size={14} color="var(--clay)" />
              <span>最終撮影</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{photo ? fmtLong(photo.takenAt) : "まだなし"}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            to={`/plant/${id}/camera`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--clay)", color: "#fff", fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 16 }}
          >
            <CameraIcon size={18} color="#fff" strokeWidth={2} />
            <span>撮影する</span>
          </Link>
          <button
            type="button"
            onClick={handleWater}
            disabled={watering_busy}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface)", border: "1.5px solid var(--sage)", color: "var(--sage-dark)", fontSize: 15, fontWeight: 700, padding: 15, borderRadius: 16, cursor: "pointer" }}
          >
            <DropIcon size={18} color="var(--sage-dark)" strokeWidth={2} />
            <span>水やりした</span>
          </button>
        </div>

        <Link
          to={`/plant/${id}/growth`}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "16px 18px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <PlayIcon size={20} color="var(--clay)" />
            <span style={{ fontSize: 15, fontWeight: 600 }}>成長を見る</span>
          </div>
          <ChevronRightIcon />
        </Link>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            to={`/plant/${id}/compare`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "13px 10px", fontSize: 14, fontWeight: 600 }}
          >
            前回と比較
          </Link>
          <Link
            to={`/plant/${id}/album`}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, padding: "13px 10px", fontSize: 14, fontWeight: 600 }}
          >
            成長アルバム
          </Link>
        </div>

        <Link to={`/plant/${id}/watering`} style={{ fontSize: 13, color: "var(--muted)", textAlign: "center", textDecoration: "underline" }}>
          水やり履歴を見る
        </Link>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>メモ</div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={handleMemoBlur}
            placeholder="例：成長点が少し開いてきた"
            rows={2}
            style={{
              background: "var(--clay-soft)",
              border: "none",
              borderRadius: 14,
              padding: "14px 16px",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#4A4438",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
        </div>
      </div>
    </div>
  );
}

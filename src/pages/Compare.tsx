import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlant, listPhotosForPlant } from "../db";
import type { Photo, Plant } from "../types";
import { BackIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtLong } from "../utils/date";

type Mode = "side" | "slider" | "overlay";

const MODE_LABEL: Record<Mode, string> = { side: "左右", slider: "スライダー", overlay: "重ねる" };

export function Compare() {
  const { id = "" } = useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [beforeIdx, setBeforeIdx] = useState(0);
  const [afterIdx, setAfterIdx] = useState(1);
  const [mode, setMode] = useState<Mode>("side");
  const [sliderPos, setSliderPos] = useState(50);
  const [overlayOpacity, setOverlayOpacity] = useState(50);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
    listPhotosForPlant(id).then((ps) => {
      setPhotos(ps);
      setBeforeIdx(Math.max(0, ps.length - 2));
      setAfterIdx(Math.max(0, ps.length - 1));
    });
  }, [id]);

  const before = photos[beforeIdx];
  const after = photos[afterIdx];
  const beforeUrl = useObjectUrl(before?.original);
  const afterUrl = useObjectUrl(after?.original);

  const canCompare = photos.length >= 2;

  if (photos.length > 0 && !canCompare) {
    return (
      <div className="app-shell">
        <Header plantName={plant?.name} id={id} />
        <div style={{ padding: "40px 24px", color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
          比較するには写真が2枚以上必要です。まずはもう1枚撮影してみましょう。
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Header plantName={plant?.name} id={id} />

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <PhotoSelect label="前" photos={photos} value={beforeIdx} onChange={setBeforeIdx} />
          <PhotoSelect label="今" photos={photos} value={afterIdx} onChange={setAfterIdx} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "7px 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: m === mode ? 700 : 600,
                color: m === mode ? "#fff" : "var(--muted)",
                background: m === mode ? "var(--clay)" : "var(--surface)",
                border: m === mode ? "none" : "1px solid var(--line)",
                cursor: "pointer",
              }}
            >
              {MODE_LABEL[m]}
            </button>
          ))}
        </div>

        {mode === "side" && (
          <div style={{ display: "flex", gap: 10 }}>
            <Frame url={beforeUrl} label={before ? fmtLong(before.takenAt) : ""} />
            <Frame url={afterUrl} label={after ? fmtLong(after.takenAt) : ""} />
          </div>
        )}

        {mode === "slider" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 22, overflow: "hidden", background: "#000" }}>
              {beforeUrl && (
                <img src={beforeUrl} alt="前" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {afterUrl && (
                <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
                  <img src={afterUrl} alt="今" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: `${sliderPos}%`, width: 3, background: "#fff", transform: "translateX(-1.5px)", boxShadow: "0 0 6px rgba(0,0,0,0.4)" }} />
              <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 9px", borderRadius: 100 }}>前</div>
              <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, padding: "3px 9px", borderRadius: 100 }}>今</div>
            </div>
            <input type="range" min={0} max={100} value={sliderPos} onChange={(e) => setSliderPos(Number(e.target.value))} />
          </div>
        )}

        {mode === "overlay" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 22, overflow: "hidden", background: "#000" }}>
              {beforeUrl && (
                <img src={beforeUrl} alt="前" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              )}
              {afterUrl && (
                <img src={afterUrl} alt="今" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: overlayOpacity / 100 }} />
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>前</span>
              <input type="range" min={0} max={100} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>今</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ plantName, id }: { plantName?: string; id: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
      <Link to={`/plant/${id}`} aria-label="株詳細に戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <BackIcon />
      </Link>
      <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plantName ? `${plantName}を比較` : "前回と比較"}</div>
    </div>
  );
}

function Frame({ url, label }: { url?: string; label: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          aspectRatio: "1 / 1",
          borderRadius: 18,
          overflow: "hidden",
          backgroundColor: url ? "#000" : undefined,
          backgroundImage: url ? `url("${url}")` : "linear-gradient(180deg, #F1ECDC 0%, #E8E0CB 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>{label}</div>
    </div>
  );
}

function PhotoSelect({ label, photos, value, onChange }: { label: string; photos: Photo[]; value: number; onChange: (i: number) => void }) {
  return (
    <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)" }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 14, color: "var(--ink)", fontFamily: "inherit" }}
      >
        {photos.map((p, i) => (
          <option key={p.id} value={i}>
            {fmtLong(p.takenAt)}
          </option>
        ))}
      </select>
    </label>
  );
}

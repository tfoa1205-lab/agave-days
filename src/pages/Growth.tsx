import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPlant, listPhotosForPlant, deletePhoto } from "../db";
import type { Photo, Plant } from "../types";
import { PetalGlyph } from "../components/PetalGlyph";
import { BackIcon, PauseIcon, PlayIcon } from "../components/Icons";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { fmtLong, fmtShort } from "../utils/date";

type Period = "30" | "60" | "90" | "all";
type Speed = "slow" | "normal" | "fast";

const PERIOD_LABEL: Record<Period, string> = { "30": "30日", "60": "60日", "90": "90日", all: "全期間" };
const SPEED_LABEL: Record<Speed, string> = { slow: "ゆっくり", normal: "標準", fast: "速い" };
const SPEED_MS: Record<Speed, number> = { slow: 1400, normal: 800, fast: 400 };

export function Growth() {
  const { id = "" } = useParams();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [period, setPeriod] = useState<Period>("all");
  const [speed, setSpeed] = useState<Speed>("normal");
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
    listPhotosForPlant(id).then((ps) => {
      setPhotos(ps);
      setIndex(Math.max(0, ps.length - 1));
    });
  }, [id]);

  const filtered = useMemo(() => {
    if (period === "all") return photos;
    const days = Number(period);
    const cutoff = Date.now() - days * 86400000;
    return photos.filter((p) => new Date(p.takenAt).getTime() >= cutoff);
  }, [photos, period]);

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    if (!playing || filtered.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % filtered.length);
    }, SPEED_MS[speed]);
    return () => clearInterval(t);
  }, [playing, speed, filtered.length]);

  const safeIndex = Math.min(index, filtered.length - 1);
  const current = filtered[safeIndex];
  const currentUrl = useObjectUrl(current?.original);

  async function handleDeleteCurrent() {
    if (!current) return;
    const ok = window.confirm(`${fmtLong(current.takenAt)}の写真を削除しますか？`);
    if (!ok) return;
    await deletePhoto(current.id);
    setPhotos((prev) => prev.filter((p) => p.id !== current.id));
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link to={`/plant/${id}`} aria-label="株詳細に戻る" style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>{plant ? `${plant.name}の成長` : "成長を見る"}</div>
      </div>

      <div style={{ flex: "1 1 auto", padding: "6px 20px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              style={{
                padding: "7px 14px",
                borderRadius: 100,
                fontSize: 13,
                fontWeight: p === period ? 700 : 600,
                color: p === period ? "#fff" : "var(--muted)",
                background: p === period ? "var(--clay)" : "var(--surface)",
                border: p === period ? "none" : "1px solid var(--line)",
                cursor: "pointer",
              }}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, padding: "40px 4px", textAlign: "center" }}>この期間の写真はまだありません。</div>
        ) : (
          <>
            <div
              style={{
                position: "relative",
                borderRadius: 22,
                overflow: "hidden",
                aspectRatio: "1 / 1",
                backgroundColor: currentUrl ? "#000" : undefined,
                backgroundImage: currentUrl ? `url("${currentUrl}")` : "linear-gradient(180deg, #F1ECDC 0%, #E8E0CB 100%)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!currentUrl && <PetalGlyph size={190} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: -8 }}>
              {filtered.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setPlaying((v) => !v)}
                  aria-label={playing ? "一時停止" : "再生"}
                  style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--clay)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                >
                  {playing ? <PauseIcon size={13} /> : <PlayIcon size={13} />}
                </button>
              ) : (
                <div style={{ width: 30, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 13, color: "var(--muted)" }}>{fmtLong(current.takenAt)} の写真</span>
              <button
                type="button"
                onClick={handleDeleteCurrent}
                aria-label="この写真を削除"
                style={{ background: "none", border: "none", padding: 2, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--muted)", flexShrink: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                </svg>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>再生速度</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(Object.keys(SPEED_LABEL) as Speed[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: 9,
                      borderRadius: 12,
                      fontSize: 13,
                      fontWeight: s === speed ? 700 : 600,
                      color: s === speed ? "#fff" : "var(--muted)",
                      background: s === speed ? "var(--sage)" : "var(--surface)",
                      border: s === speed ? "none" : "1px solid var(--line)",
                      cursor: "pointer",
                    }}
                  >
                    {SPEED_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>写真タイムライン</div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
                {filtered.map((p, i) => (
                  <Thumb key={p.id} photo={p} active={i === safeIndex} onClick={() => { setPlaying(false); setIndex(i); }} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Thumb({ photo, active, onClick }: { photo: Photo; active: boolean; onClick: () => void }) {
  const url = useObjectUrl(photo.thumbnail);
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        padding: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 14,
          backgroundColor: "#EDE6D3",
          backgroundImage: url ? `url("${url}")` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          border: active ? "2px solid var(--clay)" : "2px solid transparent",
          boxSizing: "border-box",
        }}
      />
      <div style={{ fontSize: 11, color: active ? "var(--clay)" : "var(--muted)", fontWeight: active ? 700 : 400 }}>{fmtShort(photo.takenAt)}</div>
    </button>
  );
}

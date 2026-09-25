import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addPhoto, getPlant } from "../db";
import type { Plant } from "../types";
import { useDeviceLevel } from "../hooks/useDeviceLevel";
import { dateInputToIso, todayInputValue } from "../utils/date";
import { captureSharpestSquare } from "../utils/capture";

const LEVEL_THRESHOLD = 8;

export function Camera() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [takenAtDate, setTakenAtDate] = useState(todayInputValue());
  const { tilt, needsPermission, requestPermission } = useDeviceLevel();
  const isLevel = tilt !== null && tilt < LEVEL_THRESHOLD;
  const isBackdated = takenAtDate !== todayInputValue();

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
  }, [id]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 4096 },
          height: { ideal: 4096 },
          advanced: [{ focusMode: "continuous" } as MediaTrackConstraintSet],
        },
        audio: false,
      })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraError(true));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function goBack() {
    navigate(`/plant/${id}`);
  }

  async function handleCapture() {
    const video = videoRef.current;
    if (!video || busy) return;
    setBusy(true);
    try {
      const blob = await captureSharpestSquare(video);
      await addPhoto({ plantId: id, original: blob, takenAt: dateInputToIso(takenAtDate) });
      goBack();
    } finally {
      setBusy(false);
    }
  }

  async function handleFilePicked(file: File | null) {
    if (!file || busy) return;
    setBusy(true);
    try {
      await addPhoto({ plantId: id, original: file, takenAt: dateInputToIso(takenAtDate) });
      goBack();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell" style={{ background: "#17150F", color: "#fff", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 0" }}>
        <button
          type="button"
          onClick={goBack}
          aria-label="キャンセル"
          style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.04em" }}>{plant ? `${plant.name} を撮影` : "撮影"}</div>
        <button
          type="button"
          onClick={needsPermission ? requestPermission : undefined}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: isLevel ? "rgba(110,127,94,0.35)" : "rgba(224,160,92,0.25)",
            border: `1px solid ${isLevel ? "#8FA57B" : "#E0A05C"}`,
            color: isLevel ? "#C7D6B8" : "#F0C79A",
            fontSize: 11,
            fontWeight: 700,
            padding: "5px 10px",
            borderRadius: 100,
            cursor: needsPermission ? "pointer" : "default",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isLevel ? "#A8D18D" : "#E0A05C", display: "inline-block" }} />
          <span>{tilt === null ? (needsPermission ? "タップして計測" : "水平") : isLevel ? "水平" : `傾き${Math.round(tilt)}°`}</span>
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "10px 20px 0" }}>
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: isBackdated ? "rgba(224,160,92,0.18)" : "rgba(255,255,255,0.08)",
            border: `1px solid ${isBackdated ? "rgba(224,160,92,0.55)" : "rgba(255,255,255,0.15)"}`,
            padding: "6px 12px",
            borderRadius: 100,
            cursor: "pointer",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={isBackdated ? "#F0C79A" : "#C7BFAE"} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          <span style={{ fontSize: 12, color: isBackdated ? "#F0C79A" : "#EDE7D8" }}>{isBackdated ? "この日で記録" : "撮影日"}</span>
          <input
            type="date"
            value={takenAtDate}
            max={todayInputValue()}
            onChange={(e) => setTakenAtDate(e.target.value || todayInputValue())}
            style={{
              background: "transparent",
              border: "none",
              color: isBackdated ? "#F0C79A" : "#EDE7D8",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              colorScheme: "dark",
            }}
          />
        </label>
      </div>

      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 16px" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 358, aspectRatio: "1 / 1", borderRadius: 20, overflow: "hidden", background: "radial-gradient(circle at 50% 50%, #2A2A22 0%, #1B1A14 70%)" }}>
          {!cameraError && (
            <video ref={videoRef} autoPlay playsInline muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          )}
          {cameraError && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontSize: 13, color: "#B7AD98" }}>
              カメラを利用できません。下の「既存の写真から選択」をお使いください。
            </div>
          )}
          <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,0.18)" }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "rgba(255,255,255,0.10)" }} />
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 128,
              height: 128,
              transform: "translate(-50%,-50%)",
              border: `2px dashed ${tilt !== null ? (isLevel ? "rgba(168,209,141,0.85)" : "rgba(224,160,92,0.85)") : "rgba(255,255,255,0.55)"}`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.15s ease",
            }}
          >
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: tilt !== null && isLevel ? "#A8D18D" : "#E0A05C" }} />
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", padding: "9px 16px", borderRadius: 100, fontSize: 13, color: "#EDE7D8" }}>成長点を中央に合わせてください</div>
      </div>

      <div style={{ flexShrink: 0, padding: "22px 26px 34px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label
          aria-label="既存の写真から選択"
          style={{ width: 46, height: 46, borderRadius: 12, background: "#2B2A22", border: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D8D2C2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M21 16l-5.5-5.5L9 17" />
          </svg>
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFilePicked(e.target.files?.[0] ?? null)} />
        </label>

        <button
          type="button"
          onClick={handleCapture}
          disabled={cameraError || busy}
          aria-label="撮影する"
          style={{ width: 74, height: 74, borderRadius: "50%", background: "#fff", border: "4px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center", cursor: cameraError ? "default" : "pointer", opacity: cameraError ? 0.4 : 1 }}
        >
          <span style={{ width: 58, height: 58, borderRadius: "50%", background: "#fff", border: "2px solid #17150F", display: "inline-block" }} />
        </button>

        <div style={{ width: 46, height: 46 }} />
      </div>
    </div>
  );
}

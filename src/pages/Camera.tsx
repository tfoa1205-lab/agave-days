import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addPhoto, getPlant } from "../db";
import type { Plant } from "../types";

export function Camera() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [plant, setPlant] = useState<Plant | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getPlant(id).then((p) => setPlant(p ?? null));
  }, [id]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
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
      const size = Math.min(video.videoWidth, video.videoHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const sx = (video.videoWidth - size) / 2;
      const sy = (video.videoHeight - size) / 2;
      ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("capture failed"))), "image/jpeg", 0.92)
      );
      await addPhoto({ plantId: id, original: blob });
      goBack();
    } finally {
      setBusy(false);
    }
  }

  async function handleFilePicked(file: File | null) {
    if (!file || busy) return;
    setBusy(true);
    try {
      await addPhoto({ plantId: id, original: file });
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
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(110,127,94,0.35)", border: "1px solid #8FA57B", color: "#C7D6B8", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 100 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A8D18D", display: "inline-block" }} />
          <span>水平</span>
        </div>
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
          <div style={{ position: "absolute", left: "50%", top: "50%", width: 128, height: 128, transform: "translate(-50%,-50%)", border: "2px dashed rgba(255,255,255,0.55)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E0A05C" }} />
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

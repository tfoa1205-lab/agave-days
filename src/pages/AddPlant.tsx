import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { addPlant, addPhoto } from "../db";
import { BackIcon, CameraIcon } from "../components/Icons";

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid var(--line)",
  background: "var(--surface)",
  fontSize: 15,
  color: "var(--ink)",
  fontFamily: "inherit",
};

export function AddPlant() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchasePlace, setPurchasePlace] = useState("");
  const [memo, setMemo] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const photoUrl = useMemo(() => (photoFile ? URL.createObjectURL(photoFile) : undefined), [photoFile]);
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      const plant = await addPlant({
        name: name.trim(),
        species: species.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: purchasePrice.trim() || undefined,
        purchasePlace: purchasePlace.trim() || undefined,
        memo: memo.trim() || undefined,
      });
      if (photoFile) {
        await addPhoto({ plantId: plant.id, original: photoFile });
      }
      navigate(`/plant/${plant.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link
          to="/"
          aria-label="ホームに戻る"
          style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>
          株を追加
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: "1 1 auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
            <span>株名</span>
            <span style={{ color: "var(--clay)", fontSize: 11 }}>必須</span>
          </div>
          <input className="agv-field" style={fieldStyle} type="text" placeholder="例：SAD" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>品種名</div>
          <input style={fieldStyle} type="text" placeholder="例：Agave titanota" value={species} onChange={(e) => setSpecies(e.target.value)} />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>購入日</div>
            <input style={fieldStyle} type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>購入価格</div>
            <input style={fieldStyle} type="text" placeholder="例：1,000円" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>購入先</div>
          <input style={fieldStyle} type="text" placeholder="例：〇〇園芸店" value={purchasePlace} onChange={(e) => setPurchasePlace(e.target.value)} />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>メモ</div>
          <textarea style={{ ...fieldStyle, resize: "none", lineHeight: 1.5 }} rows={3} placeholder="例：上株、成長点が大きい" value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>初回写真</div>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              height: 128,
              borderRadius: 16,
              border: "1.5px dashed #C9BFA4",
              background: "var(--surface)",
              color: "var(--clay-soft-ink)",
              cursor: "pointer",
              overflow: "hidden",
            }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <CameraIcon size={26} color="var(--clay-soft-ink)" strokeWidth={1.8} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>写真を選択</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!name.trim() || saving}
          style={{
            textAlign: "center",
            background: "var(--clay)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 700,
            padding: 16,
            borderRadius: 16,
            marginTop: 8,
            border: "none",
            opacity: !name.trim() || saving ? 0.5 : 1,
            cursor: !name.trim() || saving ? "default" : "pointer",
          }}
        >
          {saving ? "保存中…" : "保存する"}
        </button>
      </form>
    </div>
  );
}

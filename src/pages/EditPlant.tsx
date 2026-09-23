import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getPlant, updatePlant, deletePlant } from "../db";
import type { Plant } from "../types";
import { BackIcon } from "../components/Icons";

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

export function EditPlant() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [plant, setPlant] = useState<Plant | null | undefined>(undefined);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchasePlace, setPurchasePlace] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPlant(id).then((p) => {
      setPlant(p ?? null);
      if (p) {
        setName(p.name);
        setSpecies(p.species ?? "");
        setPurchaseDate(p.purchaseDate ?? "");
        setPurchasePrice(p.purchasePrice ?? "");
        setPurchasePlace(p.purchasePlace ?? "");
        setMemo(p.memo ?? "");
      }
    });
  }, [id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await updatePlant(id, {
        name: name.trim(),
        species: species.trim() || undefined,
        purchaseDate: purchaseDate || undefined,
        purchasePrice: purchasePrice.trim() || undefined,
        purchasePlace: purchasePlace.trim() || undefined,
        memo: memo.trim() || undefined,
      });
      navigate(`/plant/${id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (deleting) return;
    const ok = window.confirm(`「${plant?.name}」を削除しますか？\n撮影した写真・水やり履歴もすべて削除され、元に戻せません。`);
    if (!ok) return;
    setDeleting(true);
    try {
      await deletePlant(id);
      navigate("/", { replace: true });
    } finally {
      setDeleting(false);
    }
  }

  if (plant === undefined) return null;
  if (plant === null) {
    return (
      <div className="app-shell" style={{ padding: 24 }}>
        <p>株が見つかりませんでした。</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "22px 20px 10px", flexShrink: 0 }}>
        <Link
          to={`/plant/${id}`}
          aria-label="株詳細に戻る"
          style={{ width: 36, height: 36, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
        >
          <BackIcon />
        </Link>
        <div className="serif" style={{ fontWeight: 600, fontSize: 18 }}>株を編集</div>
      </div>

      <form onSubmit={handleSubmit} style={{ flex: "1 1 auto", padding: "10px 20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--ink-soft)" }}>
            <span>株名</span>
            <span style={{ color: "var(--clay)", fontSize: 11 }}>必須</span>
          </div>
          <input style={fieldStyle} type="text" placeholder="例：SAD" value={name} onChange={(e) => setName(e.target.value)} required />
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

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          style={{
            textAlign: "center",
            background: "none",
            color: "#B23B3B",
            fontSize: 14,
            fontWeight: 600,
            padding: 14,
            borderRadius: 16,
            border: "1px solid rgba(178,59,59,0.35)",
            marginTop: 4,
            cursor: deleting ? "default" : "pointer",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          {deleting ? "削除中…" : "この株を削除する"}
        </button>
      </form>
    </div>
  );
}

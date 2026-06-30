import { startTransition } from "react";
import type { DielineConfig } from "../types/customizer";
import type { ArtworkObjectEx } from "../hooks/useArtworkEditor";

const PACKAGE_COLORS = ["#c5a880", "#ffffff", "#222222", "#a3b899", "#4c6e8d"];

interface ArtworkLayerListProps {
  artworks: ArtworkObjectEx[];
  selectedArtworkId: string | null;
  dieline: DielineConfig;
  packageColor: string;
  currentScale: number;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onSelectArtwork: (id: string) => void;
  onRemoveArtwork: (id: string) => void;
  onAddArtwork: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScaleChange: (scale: number) => void;
  onOpacityChange: (opacity: number) => void;
  onFlip: (axis: "x" | "y") => void;
  onLayerMove: (id: string, direction: "up" | "down") => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isOutOfBounds: (art: ArtworkObjectEx) => boolean;
}

function IconBtn({
  onClick, title, disabled = false, active = false, children,
}: {
  onClick: () => void; title: string; disabled?: boolean; active?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: "30px", height: "30px", border: `1px solid ${active ? "#8b5cf6" : "#eef0f2"}`,
        borderRadius: "6px", background: active ? "#f5f3ff" : "transparent",
        color: disabled ? "#ccc" : active ? "#8b5cf6" : "#444",
        cursor: disabled ? "not-allowed" : "pointer", fontSize: "14px",
      }}
    >
      {children}
    </button>
  );
}

export function ArtworkLayerList({
  artworks, selectedArtworkId, dieline, packageColor, currentScale,
  canUndo, canRedo, onBack, onSelectArtwork, onRemoveArtwork, onAddArtwork,
  onScaleChange, onOpacityChange, onFlip, onLayerMove, onColorChange, onSave,
  onUndo, onRedo, isOutOfBounds,
}: ArtworkLayerListProps) {

  const selectedArt = artworks.find((a) => a.id === selectedArtworkId) ?? null;
  // Display layers top-to-bottom (highest zIndex first)
  const sortedArtworks = [...artworks].sort((a, b) => (b.zIndex ?? 1) - (a.zIndex ?? 1));
  const sortedIdx = sortedArtworks.findIndex((a) => a.id === selectedArtworkId);

  return (
    <div
      style={{
        width: "280px", backgroundColor: "#fff", borderRight: "1px solid #eef0f2",
        display: "flex", flexDirection: "column", padding: "24px",
        boxSizing: "border-box", zIndex: 10, flexShrink: 0, overflowY: "auto",
      }}
    >
      {/* Back + Undo/Redo row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => startTransition(onBack)}
          style={{ background: "transparent", border: "none", color: "#666", fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", gap: "4px" }}>
          <IconBtn onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>↩</IconBtn>
          <IconBtn onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}>↪</IconBtn>
        </div>
      </div>

      {/* Layer list */}
      <h3 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#999", margin: "0 0 10px 0" }}>
        Artwork Layers
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {sortedArtworks.map((art, idx) => (
          <div
            key={art.id}
            onClick={() => onSelectArtwork(art.id)}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px",
              borderRadius: "8px",
              border: `1px solid ${selectedArtworkId === art.id ? "#8b5cf6" : "#eef0f2"}`,
              backgroundColor: selectedArtworkId === art.id ? "#f5f3ff" : "#fff",
              cursor: "pointer",
            }}
          >
            {/* Layer order arrows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <button
                onClick={(e) => { e.stopPropagation(); onLayerMove(art.id, "up"); }}
                disabled={idx === 0}
                title="Move layer up"
                style={{ background: "none", border: "none", padding: "0 2px", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? "#ddd" : "#888", fontSize: "10px", lineHeight: 1 }}
              >▲</button>
              <button
                onClick={(e) => { e.stopPropagation(); onLayerMove(art.id, "down"); }}
                disabled={idx === sortedArtworks.length - 1}
                title="Move layer down"
                style={{ background: "none", border: "none", padding: "0 2px", cursor: idx === sortedArtworks.length - 1 ? "default" : "pointer", color: idx === sortedArtworks.length - 1 ? "#ddd" : "#888", fontSize: "10px", lineHeight: 1 }}
              >▼</button>
            </div>

            <img src={art.dataUrl} alt="" style={{ width: "32px", height: "32px", objectFit: "contain", borderRadius: "4px", backgroundColor: "#f9f9f9", opacity: art.opacity }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "11px", fontWeight: "600", color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                Artwork {sortedArtworks.length - idx}
              </div>
              <div style={{ fontSize: "9px", color: "#aaa" }}>
                {Math.round(art.rotation ?? 0)}° · {Math.round((art.opacity ?? 1) * 100)}%
                {art.flipX ? " ↔" : ""}{art.flipY ? " ↕" : ""}
              </div>
              {isOutOfBounds(art) && (
                <div style={{ fontSize: "10px", color: "#ef4444", marginTop: "2px" }}>⚠ Outside print zone</div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onRemoveArtwork(art.id); }}
              style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "13px", padding: "2px 4px" }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add artwork */}
      <div style={{ position: "relative", marginBottom: "18px" }}>
        <input type="file" accept="image/*" onChange={onAddArtwork}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }} />
        <button style={{ width: "100%", padding: "8px", border: "1px dashed #8b5cf6", borderRadius: "8px", backgroundColor: "#f5f3ff", color: "#8b5cf6", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
          + Add Artwork
        </button>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 16px 0" }} />

      {/* Per-artwork controls */}
      {selectedArt && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>

          {/* Scale */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "5px" }}>
              Scale · {Math.round(currentScale * 100)}%
            </label>
            <input type="range" min="0.2" max="2.5" step="0.05" value={currentScale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#8b5cf6" }} />
          </div>

          {/* Opacity */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "5px" }}>
              Opacity · {Math.round((selectedArt.opacity ?? 1) * 100)}%
            </label>
            <input type="range" min="0" max="1" step="0.01" value={selectedArt.opacity ?? 1}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "#8b5cf6" }} />
          </div>

          {/* Rotation readout */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "5px" }}>
              Rotation · {Math.round(selectedArt.rotation ?? 0)}°
            </label>
            <input type="range" min="-180" max="180" step="1" value={selectedArt.rotation ?? 0}
              onChange={(e) => {
                const rot = parseFloat(e.target.value);
                // Dispatch a synthetic rotation — handled via a custom event or we can wire a prop
                window.dispatchEvent(new CustomEvent("artwork:rotate", { detail: { id: selectedArt.id, rotation: rot } }));
              }}
              style={{ width: "100%", accentColor: "#8b5cf6" }} />
          </div>

          {/* Flip */}
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#999", textTransform: "uppercase", marginBottom: "6px" }}>
              Flip
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => onFlip("x")}
                style={{
                  flex: 1, padding: "6px", border: `1px solid ${selectedArt.flipX ? "#8b5cf6" : "#eef0f2"}`,
                  borderRadius: "6px", fontSize: "11px", fontWeight: "600",
                  backgroundColor: selectedArt.flipX ? "#f5f3ff" : "#fff",
                  color: selectedArt.flipX ? "#8b5cf6" : "#555", cursor: "pointer",
                }}
              >↔ Horizontal</button>
              <button
                onClick={() => onFlip("y")}
                style={{
                  flex: 1, padding: "6px", border: `1px solid ${selectedArt.flipY ? "#8b5cf6" : "#eef0f2"}`,
                  borderRadius: "6px", fontSize: "11px", fontWeight: "600",
                  backgroundColor: selectedArt.flipY ? "#f5f3ff" : "#fff",
                  color: selectedArt.flipY ? "#8b5cf6" : "#555", cursor: "pointer",
                }}
              >↕ Vertical</button>
            </div>
          </div>
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "0 0 16px 0" }} />

      {/* Material color */}
      <h3 style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#999", margin: "0 0 10px 0" }}>
        Material Color
      </h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "auto" }}>
        {PACKAGE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: packageColor === color ? "2px solid #8b5cf6" : "1px solid #ccc",
              backgroundColor: color, cursor: "pointer",
              transform: packageColor === color ? "scale(1.1)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        style={{
          marginTop: "24px", width: "100%", padding: "14px",
          backgroundColor: "#8b5cf6", color: "#fff", border: "none",
          borderRadius: "8px", fontWeight: "600", cursor: "pointer",
        }}
      >
        Save Configuration
      </button>
    </div>
  );
}
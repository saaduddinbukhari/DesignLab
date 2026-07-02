import { startTransition } from "react";
import type { DielineConfig } from "../types/customizer";
import type { ArtworkObjectEx } from "../hooks/useArtworkEditor";

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

export function ArtworkLayerList({
  artworks, selectedArtworkId, dieline, packageColor, currentScale,
  canUndo, canRedo, onBack, onSelectArtwork, onRemoveArtwork, onAddArtwork,
  onScaleChange, onOpacityChange, onFlip, onLayerMove, onColorChange, onSave,
  onUndo, onRedo, isOutOfBounds,
}: ArtworkLayerListProps) {

  const selectedArt = artworks.find((a) => a.id === selectedArtworkId) ?? null;
  const sortedArtworks = [...artworks].sort((a, b) => (b.zIndex ?? 1) - (a.zIndex ?? 1));

  // Shared button style that matches Prestige ghost/outline buttons
  const ghostBtn = (active = false): React.CSSProperties => ({
    font: "var(--button-font)",
    fontFamily: "var(--text-font-family)",
    letterSpacing: "var(--button-letter-spacing)",
    textTransform: "var(--button-text-transform)" as any,
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "30px", height: "30px",
    border: `1px solid ${active ? "rgb(var(--accent))" : "rgb(var(--border-color))"}`,
    borderRadius: "var(--button-border-radius)",
    background: active ? "rgb(var(--accent) / 0.08)" : "transparent",
    color: active ? "rgb(var(--accent))" : "var(--app-text)",
    cursor: "pointer",
  });

  const sectionLabel: React.CSSProperties = {
    display: "block",
    font: "var(--button-font)",
    fontFamily: "var(--heading-font-family)",
    letterSpacing: "var(--heading-letter-spacing)",
    textTransform: "uppercase" as const,
    color: "var(--app-text)",
    opacity: 0.5,
    marginBottom: "5px",
  };

  return (
    <div
      style={{
        width: "280px",
        backgroundColor: "rgb(var(--background-without-opacity))",
        borderRight: "1px solid rgb(var(--border-color))",
        display: "flex", flexDirection: "column",
        padding: "24px", boxSizing: "border-box",
        zIndex: 10, flexShrink: 0, overflowY: "auto",
        // Inherit all theme font properties from the root
        fontFamily: "var(--text-font-family)",
        fontWeight: "var(--text-font-weight)" as any,
        fontStyle: "var(--text-font-style)" as any,
        letterSpacing: "var(--text-letter-spacing)",
        color: "var(--app-text)",
        fontSize: "var(--text-sm)",
      }}
    >
      {/* Back + Undo/Redo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => startTransition(onBack)}
          style={{
            font: "inherit",
            fontFamily: "var(--text-font-family)",
            fontSize: "var(--text-sm)",
            background: "transparent", border: "none",
            color: "var(--app-text)", opacity: 0.6,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", gap: "4px" }}>
          <button
            onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}
            style={{ ...ghostBtn(), opacity: canUndo ? 1 : 0.35, cursor: canUndo ? "pointer" : "not-allowed" }}
          >↩</button>
          <button
            onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}
            style={{ ...ghostBtn(), opacity: canRedo ? 1 : 0.35, cursor: canRedo ? "pointer" : "not-allowed" }}
          >↪</button>
        </div>
      </div>

      {/* Layer list heading */}
      <h3 style={{
        fontFamily: "var(--heading-font-family)",
        fontWeight: "var(--heading-font-weight)" as any,
        fontStyle: "var(--heading-font-style)" as any,
        fontSize: "var(--text-xs)",
        textTransform: "uppercase",
        letterSpacing: "var(--heading-letter-spacing)",
        color: "var(--app-text)", opacity: 0.5,
        margin: "0 0 10px 0",
      }}>
        Artwork Layers
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
        {sortedArtworks.map((art, idx) => (
          <div
            key={art.id}
            onClick={() => onSelectArtwork(art.id)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "7px 8px",
              borderRadius: "var(--input-border-radius)",
              border: `1px solid ${selectedArtworkId === art.id ? "rgb(var(--accent))" : "rgb(var(--border-color))"}`,
              backgroundColor: selectedArtworkId === art.id ? "rgb(var(--accent) / 0.06)" : "transparent",
              cursor: "pointer",
            }}
          >
            {/* Layer order arrows */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              {(["up", "down"] as const).map((dir) => {
                const isDisabled = dir === "up" ? idx === 0 : idx === sortedArtworks.length - 1;
                return (
                  <button
                    key={dir}
                    onClick={(e) => { e.stopPropagation(); onLayerMove(art.id, dir); }}
                    disabled={isDisabled}
                    style={{
                      font: "inherit",
                      background: "none", border: "none",
                      padding: "0 2px",
                      cursor: isDisabled ? "default" : "pointer",
                      color: "var(--app-text)",
                      opacity: isDisabled ? 0.2 : 0.55,
                      fontSize: "10px", lineHeight: 1,
                    }}
                  >{dir === "up" ? "▲" : "▼"}</button>
                );
              })}
            </div>

            <img src={art.dataUrl} alt="" style={{
              width: "32px", height: "32px", objectFit: "contain",
              borderRadius: "var(--input-border-radius)",
              backgroundColor: "rgba(var(--text-color) / 0.04)",
              opacity: art.opacity,
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "var(--text-font-family)",
                fontSize: "var(--text-xs)", fontWeight: "600",
                color: "var(--app-text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                Artwork {sortedArtworks.length - idx}
              </div>
              <div style={{
                fontFamily: "var(--text-font-family)",
                fontSize: "9px", color: "var(--app-text)", opacity: 0.45, marginTop: "1px",
              }}>
                {Math.round(art.rotation ?? 0)}° · {Math.round((art.opacity ?? 1) * 100)}%
                {art.flipX ? " ↔" : ""}{art.flipY ? " ↕" : ""}
              </div>
              {isOutOfBounds(art) && (
                <div style={{ fontFamily: "var(--text-font-family)", fontSize: "9px", color: "rgb(var(--error-text))", marginTop: "2px" }}>
                  ⚠ Outside print zone
                </div>
              )}
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onRemoveArtwork(art.id); }}
              style={{
                font: "inherit",
                background: "none", border: "none",
                color: "var(--app-text)", opacity: 0.35,
                cursor: "pointer", fontSize: "13px", padding: "2px 4px",
              }}
            >✕</button>
          </div>
        ))}
      </div>

      {/* Add artwork */}
      <div style={{ position: "relative", marginBottom: "18px" }}>
        <input type="file" accept="image/*" onChange={onAddArtwork}
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }} />
        <button style={{
          width: "100%", padding: "8px",
          border: "1px dashed rgb(var(--accent))",
          borderRadius: "var(--input-border-radius)",
          backgroundColor: "rgb(var(--accent) / 0.05)",
          color: "rgb(var(--accent))",
          font: "var(--button-font)",
          fontFamily: "var(--text-font-family)",
          letterSpacing: "var(--button-letter-spacing)",
          textTransform: "var(--button-text-transform)" as any,
          cursor: "pointer",
        }}>
          + Add Artwork
        </button>
      </div>

      <hr style={{ border: "none", borderTop: "1px solid rgb(var(--border-color))", margin: "0 0 16px 0" }} />

      {/* Per-artwork controls */}
      {selectedArt && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "16px" }}>

          <div>
            <label style={sectionLabel}>Scale · {Math.round(currentScale * 100)}%</label>
            <input type="range" min="0.2" max="2.5" step="0.05" value={currentScale}
              onChange={(e) => onScaleChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "rgb(var(--accent))" }} />
          </div>

          <div>
            <label style={sectionLabel}>Opacity · {Math.round((selectedArt.opacity ?? 1) * 100)}%</label>
            <input type="range" min="0" max="1" step="0.01" value={selectedArt.opacity ?? 1}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: "rgb(var(--accent))" }} />
          </div>

          <div>
            <label style={sectionLabel}>Rotation · {Math.round(selectedArt.rotation ?? 0)}°</label>
            <input type="range" min="-180" max="180" step="1" value={selectedArt.rotation ?? 0}
              onChange={(e) => {
                window.dispatchEvent(new CustomEvent("artwork:rotate", {
                  detail: { id: selectedArt.id, rotation: parseFloat(e.target.value) },
                }));
              }}
              style={{ width: "100%", accentColor: "rgb(var(--accent))" }} />
          </div>

          <div>
            <label style={sectionLabel}>Flip</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { axis: "x" as const, label: "↔ Horizontal", active: selectedArt.flipX },
                { axis: "y" as const, label: "↕ Vertical",   active: selectedArt.flipY },
              ].map(({ axis, label, active }) => (
                <button
                  key={axis}
                  onClick={() => onFlip(axis)}
                  style={{
                    flex: 1, padding: "6px",
                    font: "var(--button-font)",
                    fontFamily: "var(--text-font-family)",
                    letterSpacing: "var(--button-letter-spacing)",
                    textTransform: "var(--button-text-transform)" as any,
                    border: `1px solid ${active ? "rgb(var(--accent))" : "rgb(var(--border-color))"}`,
                    borderRadius: "var(--button-border-radius)",
                    backgroundColor: active ? "rgb(var(--accent) / 0.08)" : "transparent",
                    color: active ? "rgb(var(--accent))" : "var(--app-text)",
                    cursor: "pointer",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      <hr style={{ border: "none", borderTop: "1px solid rgb(var(--border-color))", margin: "0 0 16px 0" }} />

      {/* Material color */}
      <h3 style={{
        fontFamily: "var(--heading-font-family)",
        fontSize: "var(--text-xs)",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "var(--heading-letter-spacing)",
        color: "var(--app-text)", opacity: 0.5,
        margin: "0 0 10px 0",
      }}>
        Material Color
      </h3>
      <div style={{ display: "flex", gap: "8px", marginBottom: "auto" }}>
        {["#c5a880", "#ffffff", "#222222", "#a3b899", "#4c6e8d"].map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            style={{
              width: "28px", height: "28px", borderRadius: "50%",
              border: packageColor === color ? "2px solid rgb(var(--accent))" : "1px solid rgb(var(--border-color))",
              backgroundColor: color, cursor: "pointer",
              transform: packageColor === color ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.15s ease",
              boxShadow: packageColor === color ? "var(--shadow)" : "none",
            }}
          />
        ))}
      </div>

      <button onClick={onSave} className="btn-primary" style={{ marginTop: "24px", width: "100%" }}>
        Save Configuration
      </button>
    </div>
  );
}
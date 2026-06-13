import { startTransition } from "react";
import type { ArtworkObject, DielineConfig } from "../types/customizer";

const PACKAGE_COLORS = ["#c5a880", "#ffffff", "#222222", "#a3b899", "#4c6e8d"];

interface ArtworkLayerListProps {
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  dieline: DielineConfig;
  packageColor: string;
  currentScale: number;
  onBack: () => void;
  onSelectArtwork: (id: string) => void;
  onRemoveArtwork: (id: string) => void;
  onAddArtwork: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScaleChange: (scale: number) => void;
  onColorChange: (color: string) => void;
  onSave: () => void;
  isOutOfBounds: (art: ArtworkObject) => boolean;
}

export function ArtworkLayerList({
  artworks,
  selectedArtworkId,
  dieline,
  packageColor,
  currentScale,
  onBack,
  onSelectArtwork,
  onRemoveArtwork,
  onAddArtwork,
  onScaleChange,
  onColorChange,
  onSave,
  isOutOfBounds,
}: ArtworkLayerListProps) {
  return (
    <div
      style={{
        width: "280px",
        backgroundColor: "#fff",
        borderRight: "1px solid #eef0f2",
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        boxSizing: "border-box",
        zIndex: 10,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => startTransition(onBack)}
        style={{
          background: "transparent",
          border: "none",
          color: "#666",
          fontSize: "13px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "24px",
        }}
      >
        ← Back to Overview
      </button>

      {/* Layer list heading */}
      <h3
        style={{
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          color: "#999",
          margin: "0 0 12px 0",
        }}
      >
        Artwork Layers
      </h3>

      {/* Layer rows */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        {artworks.map((art, index) => (
          <div
            key={art.id}
            onClick={() => onSelectArtwork(art.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px 10px",
              borderRadius: "8px",
              border: `1px solid ${
                selectedArtworkId === art.id ? "#8b5cf6" : "#eef0f2"
              }`,
              backgroundColor:
                selectedArtworkId === art.id ? "#f5f3ff" : "#fff",
              cursor: "pointer",
            }}
          >
            <img
              src={art.dataUrl}
              alt=""
              style={{
                width: "36px",
                height: "36px",
                objectFit: "contain",
                borderRadius: "4px",
                backgroundColor: "#f9f9f9",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#111",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Artwork {index + 1}
              </div>
              {isOutOfBounds(art) && (
                <div
                  style={{
                    fontSize: "10px",
                    color: "#ef4444",
                    marginTop: "2px",
                  }}
                >
                  ⚠ Outside print zone
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemoveArtwork(art.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#aaa",
                cursor: "pointer",
                fontSize: "14px",
                padding: "2px 4px",
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add artwork */}
      <div style={{ position: "relative", marginBottom: "20px" }}>
        <input
          type="file"
          accept="image/*"
          onChange={onAddArtwork}
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        />
        <button
          style={{
            width: "100%",
            padding: "8px",
            border: "1px dashed #8b5cf6",
            borderRadius: "8px",
            backgroundColor: "#f5f3ff",
            color: "#8b5cf6",
            fontSize: "12px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          + Add Artwork
        </button>
      </div>

      <hr
        style={{
          border: "none",
          borderTop: "1px solid #f0f0f0",
          margin: "0 0 20px 0",
        }}
      />

      {/* Scale slider — only shown when an artwork is selected */}
      {selectedArtworkId && (
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: "700",
              color: "#999",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Artwork Scale
          </label>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={currentScale}
            onChange={(e) => onScaleChange(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#8b5cf6" }}
          />
        </div>
      )}

      {/* Material color */}
      <h3
        style={{
          fontSize: "11px",
          fontWeight: "700",
          textTransform: "uppercase",
          color: "#999",
          margin: "0 0 12px 0",
        }}
      >
        Material Color
      </h3>
      <div
        style={{ display: "flex", gap: "8px", marginBottom: "32px" }}
      >
        {PACKAGE_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              border:
                packageColor === color
                  ? "2px solid #8b5cf6"
                  : "1px solid #ccc",
              backgroundColor: color,
              cursor: "pointer",
              transform:
                packageColor === color ? "scale(1.1)" : "scale(1)",
            }}
          />
        ))}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        style={{
          marginTop: "auto",
          width: "100%",
          padding: "14px",
          backgroundColor: "#8b5cf6",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          fontWeight: "600",
          cursor: "pointer",
        }}
      >
        Save Configuration
      </button>
    </div>
  );
}

import { useRef, useCallback } from "react";
import type { ArtworkObject, DielineConfig } from "../types/customizer";

interface ArtworkCanvasProps {
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  dieline: DielineConfig;
  displaySize: number;
  onMouseDown: (e: React.MouseEvent) => void;
  onSelectArtwork: (id: string) => void;
  isOutOfBounds: (art: ArtworkObject) => boolean;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

export type ResizeHandle =
  | "nw" | "n" | "ne"
  | "e"
  | "se" | "s" | "sw"
  | "w";

const HANDLE_SIZE = 8;
const ROTATE_OFFSET = 22;

export function ArtworkCanvas({
  artworks,
  selectedArtworkId,
  isDragging,
  dieline,
  displaySize,
  onMouseDown,
  onSelectArtwork,
  isOutOfBounds,
  onResizeStart,
  onRotateStart,
}: ArtworkCanvasProps) {
  const displayToDielineRatio = dieline.printW / displaySize;
  const dielineToDisplay = (val: number) => val / displayToDielineRatio;
  const canvasHeight = displaySize * (dieline.printH / dieline.printW);

  const selectedArt = artworks.find((a) => a.id === selectedArtworkId) ?? null;

  // Build handle positions relative to the artwork box (in display px)
  const getHandles = (
    dw: number,
    dh: number
  ): { handle: ResizeHandle; x: number; y: number; cursor: string }[] => [
    { handle: "nw", x: 0,      y: 0,      cursor: "nw-resize" },
    { handle: "n",  x: dw / 2, y: 0,      cursor: "n-resize"  },
    { handle: "ne", x: dw,     y: 0,      cursor: "ne-resize" },
    { handle: "e",  x: dw,     y: dh / 2, cursor: "e-resize"  },
    { handle: "se", x: dw,     y: dh,     cursor: "se-resize" },
    { handle: "s",  x: dw / 2, y: dh,     cursor: "s-resize"  },
    { handle: "sw", x: 0,      y: dh,     cursor: "sw-resize" },
    { handle: "w",  x: 0,      y: dh / 2, cursor: "w-resize"  },
  ];

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: "#f0f2f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "40px",
      }}
    >
      {/* Label */}
      <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 5 }}>
        <div style={{ fontSize: "14px", fontWeight: "700" }}>2D Artwork Canvas</div>
        <div style={{ fontSize: "11px", color: "#666" }}>
          Drag to move · Handles to resize · ⟳ to rotate · Ctrl+Z to undo
        </div>
      </div>

      {/* Keyboard shortcut legend */}
      <div style={{ position: "absolute", bottom: "20px", left: "20px", zIndex: 5, display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[
          { key: "Ctrl+Z", label: "Undo" },
          { key: "Ctrl+Y", label: "Redo" },
          { key: "Del", label: "Remove" },
          { key: "[ ]", label: "Layer order" },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <kbd style={{ fontSize: "9px", fontFamily: "monospace", background: "#fff", border: "1px solid #ccc", borderRadius: "3px", padding: "1px 4px", boxShadow: "0 1px 0 #999", color: "#333" }}>{key}</kbd>
            <span style={{ fontSize: "9px", color: "#888" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Print zone */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: `${displaySize}px`,
          height: `${canvasHeight}px`,
          position: "relative",
          backgroundColor: "#ffffff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
          cursor: isDragging ? "grabbing" : "default",
          borderRadius: "4px",
          border: "2px solid #3b82f6",
          overflow: "visible",
        }}
      >
        <div style={{ position: "absolute", top: "-22px", left: 0, fontSize: "10px", color: "#3b82f6", fontWeight: "600" }}>
          Print zone: {dieline.printW}×{dieline.printH}px UV space
        </div>

        {/* Render artworks back-to-front (index 0 = bottom) */}
        {artworks.map((art) => {
          const dx = dielineToDisplay(art.x);
          const dy = dielineToDisplay(art.y);
          const dw = dielineToDisplay(art.w);
          const dh = dielineToDisplay(art.h);
          const isSelected = selectedArtworkId === art.id;
          const oob = isOutOfBounds(art);

          const scaleX = art.flipX ? -1 : 1;
          const scaleY = art.flipY ? -1 : 1;

          return (
            <div
              key={art.id}
              onClick={(e) => { e.stopPropagation(); onSelectArtwork(art.id); }}
              style={{
                position: "absolute",
                left: `${dx}px`,
                top: `${dy}px`,
                width: `${dw}px`,
                height: `${dh}px`,
                transform: `rotate(${art.rotation ?? 0}deg)`,
                transformOrigin: "center center",
                cursor: isSelected ? (isDragging ? "grabbing" : "grab") : "pointer",
                outline: isSelected
                  ? "2px solid #8b5cf6"
                  : oob
                  ? "2px dashed #ef4444"
                  : "none",
                outlineOffset: "2px",
                userSelect: "none",
                zIndex: art.zIndex ?? 1,
              }}
            >
              <img
                src={art.dataUrl}
                draggable={false}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "fill",
                  display: "block",
                  pointerEvents: "none",
                  opacity: art.opacity ?? 1,
                  transform: `scale(${scaleX}, ${scaleY})`,
                }}
                alt=""
              />

              {/* Selection overlay: resize handles + rotate handle */}
              {isSelected && (
                <>
                  {/* Corner/edge resize handles */}
                  {getHandles(dw, dh).map(({ handle, x, y, cursor }) => (
                    <div
                      key={handle}
                      onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, handle); }}
                      style={{
                        position: "absolute",
                        left: `${x - HANDLE_SIZE / 2}px`,
                        top: `${y - HANDLE_SIZE / 2}px`,
                        width: `${HANDLE_SIZE}px`,
                        height: `${HANDLE_SIZE}px`,
                        backgroundColor: "#ffffff",
                        border: "2px solid #8b5cf6",
                        borderRadius: "2px",
                        cursor,
                        zIndex: 10,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                      }}
                    />
                  ))}

                  {/* Rotate handle — above top-center */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); onRotateStart(e); }}
                    style={{
                      position: "absolute",
                      left: `${dw / 2 - 8}px`,
                      top: `${-ROTATE_OFFSET - 8}px`,
                      width: "16px",
                      height: "16px",
                      backgroundColor: "#8b5cf6",
                      borderRadius: "50%",
                      cursor: "grab",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                    title="Rotate"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6" />
                      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
                    </svg>
                  </div>

                  {/* Connector line from artwork top-center to rotate handle */}
                  <div style={{
                    position: "absolute",
                    left: `${dw / 2 - 0.5}px`,
                    top: `${-ROTATE_OFFSET}px`,
                    width: "1px",
                    height: `${ROTATE_OFFSET}px`,
                    backgroundColor: "#8b5cf6",
                    opacity: 0.5,
                    pointerEvents: "none",
                  }} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
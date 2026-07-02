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
    // Font inheritance root — all canvas labels/kbd use theme fonts from here
    <div
      style={{
        flex: 1,
        backgroundColor: "rgba(var(--text-color) / 0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "40px",
        fontFamily: "var(--text-font-family)",
        fontWeight: "var(--text-font-weight)" as any,
        fontStyle: "var(--text-font-style)" as any,
        letterSpacing: "var(--text-letter-spacing)",
        color: "var(--app-text)",
      }}
    >
      {/* Label */}
      <div style={{ position: "absolute", top: "20px", left: "20px", zIndex: 5 }}>
        <div style={{
          fontFamily: "var(--heading-font-family)",
          fontWeight: "var(--heading-font-weight)" as any,
          fontStyle: "var(--heading-font-style)" as any,
          fontSize: "var(--text-sm)",
          letterSpacing: "var(--heading-letter-spacing)",
          textTransform: "var(--heading-text-transform)" as any,
          color: "var(--app-text)",
        }}>
          2D Artwork Canvas
        </div>
        <div style={{
          fontFamily: "var(--text-font-family)",
          fontSize: "var(--text-xs)",
          color: "var(--app-text)",
          opacity: 0.5,
          marginTop: "2px",
        }}>
          Drag to move · Handles to resize · ⟳ to rotate · Ctrl+Z to undo
        </div>
      </div>

      {/* Keyboard shortcut legend */}
      <div style={{
        position: "absolute", bottom: "20px", left: "20px", zIndex: 5,
        display: "flex", gap: "10px", flexWrap: "wrap",
      }}>
        {[
          { key: "Ctrl+Z", label: "Undo" },
          { key: "Ctrl+Y", label: "Redo" },
          { key: "Del",    label: "Remove" },
          { key: "[ ]",   label: "Layer order" },
        ].map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <kbd style={{
              fontFamily: "var(--text-font-family)",
              fontSize: "9px",
              background: "rgb(var(--background-without-opacity))",
              border: "1px solid rgb(var(--border-color))",
              borderRadius: "var(--input-border-radius)",
              padding: "1px 5px",
              boxShadow: "var(--shadow-sm)",
              color: "var(--app-text)",
            }}>{key}</kbd>
            <span style={{
              fontFamily: "var(--text-font-family)",
              fontSize: "9px",
              color: "var(--app-text)",
              opacity: 0.5,
            }}>{label}</span>
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
          backgroundColor: "rgb(var(--background-without-opacity))",
          boxShadow: "var(--shadow-md)",
          cursor: isDragging ? "grabbing" : "default",
          borderRadius: "var(--input-border-radius)",
          border: "2px solid rgb(var(--accent) / 0.4)",
          overflow: "visible",
        }}
      >
        <div style={{
          position: "absolute",
          top: "-22px", left: 0,
          fontFamily: "var(--text-font-family)",
          fontSize: "var(--text-xs)",
          color: "var(--app-text)",
          opacity: 0.4,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "var(--text-letter-spacing)",
        }}>
          Print zone: {dieline.printW}×{dieline.printH}px
        </div>

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
                  ? "2px solid rgb(var(--accent))"
                  : oob
                  ? "2px dashed rgb(var(--error-text))"
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
                  width: "100%", height: "100%",
                  objectFit: "fill", display: "block",
                  pointerEvents: "none",
                  opacity: art.opacity ?? 1,
                  transform: `scale(${scaleX}, ${scaleY})`,
                }}
                alt=""
              />

              {isSelected && (
                <>
                  {/* Resize handles */}
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
                        backgroundColor: "rgb(var(--background-without-opacity))",
                        border: "2px solid rgb(var(--accent))",
                        borderRadius: "2px",
                        cursor,
                        zIndex: 10,
                        boxShadow: "var(--shadow-sm)",
                      }}
                    />
                  ))}

                  {/* Rotate handle */}
                  <div
                    onMouseDown={(e) => { e.stopPropagation(); onRotateStart(e); }}
                    style={{
                      position: "absolute",
                      left: `${dw / 2 - 8}px`,
                      top: `${-ROTATE_OFFSET - 8}px`,
                      width: "16px", height: "16px",
                      backgroundColor: "rgb(var(--accent))",
                      borderRadius: "50%",
                      cursor: "grab",
                      zIndex: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "var(--shadow)",
                    }}
                    title="Rotate"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="rgb(var(--accent-foreground, 255 255 255))"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.5 2v6h-6" />
                      <path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
                    </svg>
                  </div>

                  {/* Connector line */}
                  <div style={{
                    position: "absolute",
                    left: `${dw / 2 - 0.5}px`,
                    top: `${-ROTATE_OFFSET}px`,
                    width: "1px",
                    height: `${ROTATE_OFFSET}px`,
                    backgroundColor: "rgb(var(--accent))",
                    opacity: 0.4,
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
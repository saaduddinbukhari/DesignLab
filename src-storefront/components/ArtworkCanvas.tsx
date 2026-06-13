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
}

export function ArtworkCanvas({
  artworks,
  selectedArtworkId,
  isDragging,
  dieline,
  displaySize,
  onMouseDown,
  onSelectArtwork,
  isOutOfBounds,
}: ArtworkCanvasProps) {
  const displayToDielineRatio = dieline.printW / displaySize;
  const dielineToDisplay = (val: number) => val / displayToDielineRatio;

  const canvasHeight = displaySize * (dieline.printH / dieline.printW);

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
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          zIndex: 5,
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "700" }}>
          2D Artwork Canvas
        </div>
        <div style={{ fontSize: "11px", color: "#666" }}>
          Drag artwork to reposition. Blue outline = print boundary.
        </div>
      </div>

      {/* Print zone canvas */}
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
        {/* Print zone label */}
        <div
          style={{
            position: "absolute",
            top: "-22px",
            left: 0,
            fontSize: "10px",
            color: "#3b82f6",
            fontWeight: "600",
          }}
        >
          Print zone: {dieline.printW}×{dieline.printH}px UV space
        </div>

        {artworks.map((art) => (
          <div
            key={art.id}
            onClick={() => onSelectArtwork(art.id)}
            style={{
              position: "absolute",
              left: `${dielineToDisplay(art.x)}px`,
              top: `${dielineToDisplay(art.y)}px`,
              width: `${dielineToDisplay(art.w)}px`,
              height: `${dielineToDisplay(art.h)}px`,
              cursor:
                selectedArtworkId === art.id
                  ? isDragging
                    ? "grabbing"
                    : "grab"
                  : "pointer",
              outline:
                selectedArtworkId === art.id
                  ? "2px solid #8b5cf6"
                  : isOutOfBounds(art)
                  ? "2px dashed #ef4444"
                  : "none",
              outlineOffset: "2px",
              userSelect: "none",
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
              }}
              alt=""
            />
            {selectedArtworkId === art.id && (
              <div
                style={{
                  position: "absolute",
                  bottom: "-4px",
                  right: "-4px",
                  width: "10px",
                  height: "10px",
                  backgroundColor: "#8b5cf6",
                  borderRadius: "2px",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

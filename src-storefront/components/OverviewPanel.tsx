import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "./ModelViewport";
import { ArtworkCanvas } from "./ArtworkCanvas";
import {
  ArrowLeftIcon, PlusIcon, TrashIcon, UploadIcon,
  MixerHorizontalIcon, BlendingModeIcon,
} from "@radix-ui/react-icons";
import type { B2BProduct, DielineConfig } from "../types/customizer";
import type { ArtworkObjectEx } from "../hooks/useArtworkEditor";
import type { ResizeHandle } from "./ArtworkCanvas";
import { ColorPicker } from "./color-picker";

const DISPLAY_SIZE = 500;

interface OverviewPanelProps {
  product: B2BProduct;
  artworks: ArtworkObjectEx[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  dieline: DielineConfig;
  packageColor: string;
  currentScale: number;
  canUndo: boolean;
  canRedo: boolean;
  textureCanvas: HTMLCanvasElement | null;
  modelUrl: string | null;
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
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onResizeStart: (e: React.MouseEvent, handle: ResizeHandle) => void;
  onRotateStart: (e: React.MouseEvent) => void;
  onUndo: () => void;
  onRedo: () => void;
  isOutOfBounds: (art: ArtworkObjectEx) => boolean;
}

export function OverviewPanel({
  product, artworks, selectedArtworkId, isDragging, dieline,
  packageColor, currentScale, canUndo, canRedo, textureCanvas, modelUrl,
  onBack, onSelectArtwork, onRemoveArtwork, onAddArtwork,
  onScaleChange, onOpacityChange, onFlip, onLayerMove,
  onColorChange, onSave, onMouseDown, onMouseMove, onMouseUp,
  onResizeStart, onRotateStart, onUndo, onRedo, isOutOfBounds,
}: OverviewPanelProps) {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFinish, setActiveFinish] = useState<"matte" | "gloss">("matte");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  const selectedArt = artworks.find((a) => a.id === selectedArtworkId) ?? null;
  const sortedArtworks = [...artworks].sort((a, b) => (b.zIndex ?? 1) - (a.zIndex ?? 1));

  // ── Shared style helpers ───────────────────────────────────────────────────

  /** Section label above sliders / control groups */
  const sectionLabel: React.CSSProperties = {
    display: "block",
    font: "var(--button-font)",          // matches theme button text sizing
    fontFamily: "var(--heading-font-family)",
    letterSpacing: "var(--heading-letter-spacing)",
    textTransform: "uppercase" as const,
    color: "var(--app-text)",
    opacity: 0.5,
    marginBottom: "4px",
  };

  /** Ghost/outline button — matches the feel of native theme secondary buttons */
  const ghostBtn = (active = false, danger = false): React.CSSProperties => ({
    font: "var(--button-font)",
    fontFamily: "var(--text-font-family)",
    letterSpacing: "var(--button-letter-spacing)",
    textTransform: "var(--button-text-transform)" as any,
    padding: "5px 12px",
    border: danger
      ? "1px solid rgb(var(--error-text) / 0.35)"
      : `1px solid ${active ? "rgb(var(--accent))" : "rgb(var(--border-color))"}`,
    borderRadius: "var(--button-border-radius)",
    background: active ? "rgb(var(--accent) / 0.08)" : "transparent",
    color: danger ? "rgb(var(--error-text))" : active ? "rgb(var(--accent))" : "var(--app-text)",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap" as const,
  });

  /** Disabled-state ghost (Undo / Redo when stack is empty) */
  const disabledGhostBtn: React.CSSProperties = {
    ...ghostBtn(),
    opacity: 0.35,
    cursor: "not-allowed",
  };

  return (
    // font: inherit on root ensures all children pick up the theme body font
    // unless explicitly overridden
    <div
      className="client-3d-designer-extension"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{
        boxSizing: "border-box",
        paddingTop: "var(--container-gutter)",
        fontFamily: "var(--text-font-family)",
        fontWeight: "var(--text-font-weight)" as any,
        fontStyle: "var(--text-font-style)" as any,
        letterSpacing: "var(--text-letter-spacing)",
        color: "var(--app-text)",
      }}
    >
      <main className="main-framework-grid" style={{ marginBottom: "40px" }}>

        {/* ── LEFT: 2D Canvas ──────────────────────────────────────────── */}
        <section className="designer-panel-card" style={{ display: "flex", flexDirection: "column", flex: "1.2", minHeight: "550px" }}>

          {/* Panel header */}
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Design Area</h2>
            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)"
                style={canUndo ? ghostBtn() : disabledGhostBtn}>↩ Undo</button>
              <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)"
                style={canRedo ? ghostBtn() : disabledGhostBtn}>↪ Redo</button>
            </div>
          </div>

          {/* Canvas area */}
          <div style={{
            flexGrow: 1, position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
            backgroundImage: "linear-gradient(to right, var(--app-border) 1px, transparent 1px), linear-gradient(to bottom, var(--app-border) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}>
            {artworks.length === 0 && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                pointerEvents: "none", opacity: 0.35, userSelect: "none", zIndex: 0, textAlign: "center",
              }}>
                <UploadIcon style={{ width: "36px", height: "36px", margin: "0 auto 8px auto" }} />
                <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>Load artwork below to customize</p>
              </div>
            )}
            <div className="canvas-3d-frame" onMouseDown={onMouseDown} style={{ position: "relative", zIndex: 10, border: "1px solid var(--app-border)" }}>
              <ArtworkCanvas
                artworks={artworks}
                selectedArtworkId={selectedArtworkId}
                isDragging={isDragging}
                dieline={dieline}
                displaySize={DISPLAY_SIZE}
                onMouseDown={onMouseDown}
                onSelectArtwork={onSelectArtwork}
                isOutOfBounds={isOutOfBounds}
                onResizeStart={onResizeStart}
                onRotateStart={onRotateStart}
              />
            </div>
          </div>

          {/* ── Per-artwork controls (visible when artwork selected) ── */}
          {selectedArt && (
            <div style={{
              padding: "16px 0",
              borderTop: "1px solid var(--app-border)",
              borderBottom: "1px solid var(--app-border)",
              display: "flex", flexDirection: "column", gap: "14px",
            }}>

              {/* Scale + Opacity */}
              <div style={{ display: "flex", gap: "24px" }}>
                <div style={{ flex: 1 }}>
                  <label style={sectionLabel}>Scale · {Math.round(currentScale * 100)}%</label>
                  <input type="range" min="0.2" max="2.5" step="0.05" value={currentScale}
                    onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "rgb(var(--accent))" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={sectionLabel}>Opacity · {Math.round((selectedArt.opacity ?? 1) * 100)}%</label>
                  <input type="range" min="0" max="1" step="0.01" value={selectedArt.opacity ?? 1}
                    onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                    style={{ width: "100%", accentColor: "rgb(var(--accent))" }} />
                </div>
              </div>

              {/* Rotation */}
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

              {/* Flip + Layer + Remove */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={() => onFlip("x")} style={ghostBtn(selectedArt.flipX)}>↔ Flip H</button>
                <button onClick={() => onFlip("y")} style={ghostBtn(selectedArt.flipY)}>↕ Flip V</button>
                <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
                  <button onClick={() => onLayerMove(selectedArt.id, "up")} title="Move forward (])" style={ghostBtn()}>▲ Forward</button>
                  <button onClick={() => onLayerMove(selectedArt.id, "down")} title="Move back ([)" style={ghostBtn()}>▼ Back</button>
                </div>
                <button onClick={() => onRemoveArtwork(selectedArt.id)} style={ghostBtn(false, true)}>
                  <TrashIcon style={{ width: "12px", height: "12px" }} />
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Upload + layer thumbnails */}
          <div style={{ paddingTop: "14px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
              style={{ padding: "8px 16px", fontSize: "var(--text-xs)", flexShrink: 0 }}
            >
              <PlusIcon style={{ width: "14px", height: "14px", marginRight: "6px", verticalAlign: "middle" }} />
              Upload Design
            </button>
            <input ref={fileInputRef} type="file" accept="image/png, image/jpeg, image/svg+xml"
              onChange={onAddArtwork} style={{ display: "none" }} />

            {sortedArtworks.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {sortedArtworks.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onSelectArtwork(art.id)}
                    title={`${Math.round(art.rotation ?? 0)}° · ${Math.round((art.opacity ?? 1) * 100)}%`}
                    style={{
                      width: "36px", height: "36px",
                      borderRadius: "var(--input-border-radius)",
                      overflow: "hidden",
                      border: `2px solid ${selectedArtworkId === art.id ? "rgb(var(--accent))" : "transparent"}`,
                      outline: isOutOfBounds(art) ? "2px dashed rgb(var(--error-text))" : "none",
                      cursor: "pointer", flexShrink: 0,
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <img src={art.dataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: art.opacity }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── RIGHT: 3D Preview ─────────────────────────────────────────── */}
        <section className="designer-panel-card" style={{ display: "flex", flexDirection: "column", flex: "1", minHeight: "550px" }}>
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--app-border)" }}>
            <h2 style={{ margin: 0 }}>Live 3D Preview</h2>
          </div>

          <div className="canvas-3d-frame" style={{ flexGrow: 1 }}>
            {modelUrl ? (
              <Suspense fallback={
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", opacity: 0.5 }}>
                  Assembling 3D preview...
                </div>
              }>
                <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
                  <ambientLight intensity={0.2} />
                  <pointLight position={[10, 10, 10]} intensity={0.2} castShadow />
                  <Stage environment="warehouse" intensity={0.2} adjustCamera={false} shadows="contact">
                    <ModelViewport modelUrl={modelUrl} textureCanvas={textureCanvas} packageColor={packageColor} />
                  </Stage>
                  <OrbitControls enableZoom minDistance={0.1} maxDistance={0.5} />
                </Canvas>
              </Suspense>
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", opacity: 0.5 }}>
                ⚠️ No mesh connected for preview
              </div>
            )}
          </div>

          <div style={{ paddingTop: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Base Glaze Color */}
            <div className="form-field-group" style={{ marginBottom: 0 }}>
              <label>Base Glaze Color</label>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["#F4F2EE", "#E2E2E5", "#2C2E30", "#E6E2DC"].map((c) => (
                    <button key={c} onClick={() => onColorChange(c)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: packageColor === c ? "2px solid rgb(var(--accent))" : "1px solid var(--app-border)",
                        backgroundColor: c, cursor: "pointer",
                        boxShadow: packageColor === c ? "var(--shadow)" : "none",
                        transform: packageColor === c ? "scale(1.1)" : "scale(1)",
                        transition: "transform 0.15s ease",
                      }} />
                  ))}
                </div>

                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    style={{
                      padding: "6px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "var(--input-border-radius)",
                      border: "1px solid var(--app-border)",
                      background: "transparent", cursor: "pointer",
                    }}
                    title="Pick custom color"
                  >
                    <MixerHorizontalIcon style={{ width: "16px", height: "16px" }} />
                  </button>
                  {isColorPickerOpen && (
                    <>
                      <div style={{ position: "fixed", inset: 0, zIndex: 20 }} onClick={() => setIsColorPickerOpen(false)} />
                      <div style={{ position: "absolute", bottom: "100%", marginBottom: "12px", left: 0, zIndex: 30 }}>
                        <ColorPicker value={packageColor} onChange={onColorChange} />
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  display: "flex", alignItems: "center",
                  border: "1px solid var(--app-border)",
                  borderRadius: "var(--input-border-radius)",
                  padding: "6px 12px",
                }}>
                  <span style={{ fontSize: "var(--text-xs)", marginRight: "8px", opacity: 0.45, userSelect: "none" }}>HEX</span>
                  <input
                    type="text" value={packageColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{
                      border: "none", padding: 0, width: "80px", background: "transparent",
                      font: "inherit", fontSize: "var(--text-xs)", fontWeight: "bold",
                      textTransform: "uppercase", color: "var(--app-text)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Finish Texture */}
            <div className="form-field-group" style={{ marginBottom: 0 }}>
              <label>Finish Texture</label>
              <div style={{
                display: "flex", padding: "4px",
                border: "1px solid var(--app-border)",
                borderRadius: "var(--input-border-radius)",
                width: "fit-content",
              }}>
                {(["matte", "gloss"] as const).map((f) => (
                  <button key={f} onClick={() => setActiveFinish(f)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: "var(--input-border-radius)",
                      border: "none", cursor: "pointer",
                      font: "var(--button-font)",
                      fontFamily: "var(--text-font-family)",
                      letterSpacing: "var(--button-letter-spacing)",
                      textTransform: "var(--button-text-transform)" as any,
                      background: activeFinish === f ? "var(--app-btn-bg)" : "transparent",
                      color: activeFinish === f ? "var(--app-btn-text)" : "var(--app-text)",
                      transition: "background 0.15s ease",
                    }}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", borderTop: "1px solid var(--app-border)", paddingTop: "20px" }}>
              <button onClick={onSave} className="btn-primary" style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <BlendingModeIcon style={{ width: "16px", height: "16px" }} />
                Preview and Submit Enquiry
              </button>
              <button onClick={onBack} className="btn-primary"
                style={{ width: "100%", backgroundColor: "transparent", color: "currentColor", border: "1px solid var(--app-border)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                <ArrowLeftIcon style={{ width: "14px", height: "14px" }} />
                Back to Product Selection
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
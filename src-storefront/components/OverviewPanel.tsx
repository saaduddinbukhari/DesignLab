import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "./ModelViewport"; // 💡 Connects straight to your real-time 3D engine hook
import { ArtworkCanvas } from "./ArtworkCanvas";   // 💡 Your high-performance 2D canvas workspace
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  UploadIcon,
  MixerHorizontalIcon,
  BlendingModeIcon
} from "@radix-ui/react-icons";
import type { ArtworkObject, B2BProduct, DielineConfig } from "../types/customizer";
import { ColorPicker } from "./color-picker";

const DISPLAY_SIZE = 500;

interface OverviewPanelProps {
  product: B2BProduct;
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  dieline: DielineConfig;
  packageColor: string;
  currentScale: number;
  textureCanvas: HTMLCanvasElement | null;
  modelUrl: string | null;
  onBack: () => void;
  onSelectArtwork: (id: string) => void;
  onRemoveArtwork: (id: string) => void;
  onAddArtwork: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScaleChange: (scale: number) => void;
  onColorChange: (color: string) => void;
  onSave: () => void; // 💡 Map this callback to transition directly to your final review & inquiry checkout page!
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isOutOfBounds: (art: ArtworkObject) => boolean;
}

export function OverviewPanel({
  product,
  artworks,
  selectedArtworkId,
  isDragging,
  dieline,
  packageColor,
  currentScale,
  textureCanvas,
  modelUrl,
  onBack,
  onSelectArtwork,
  onRemoveArtwork,
  onAddArtwork,
  onScaleChange,
  onColorChange,
  onSave,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isOutOfBounds,
}: OverviewPanelProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFinish, setActiveFinish] = useState<'matte' | 'gloss'>('matte');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  return (
    <div 
      className="client-3d-designer-extension" 
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      style={{ boxSizing: "border-box", paddingTop: "var(--container-gutter)" }}
    >
      {/* 🎛️ Main Content Layout Canvas Grid */}
      <main className="main-framework-grid" style={{ marginBottom: '40px' }}>
        
        {/* 🎨 LEFT COLUMN PANEL: High Performance 2D UV Space Mapping Workspace */}
        <section className="designer-panel-card" style={{ display: 'flex', flexDirection: 'column', flex: '1.2', minHeight: '550px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--app-border)' }}>
            <h2 style={{ margin: '0' }}>Design Area</h2>
          </div>

          /* Core Interactive Rendering Mesh Wrapper */
          <div 
            style={{
              flexGrow: '1',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              backgroundColor: 'transparent',
              backgroundImage: "linear-gradient(to right, var(--app-border) 1px, transparent 1px), linear-gradient(to bottom, var(--app-border) 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          >
            {/* Instruction Overlay Background Layer */}
            {artworks.length === 0 && (
              <div style={{ position: 'absolute', inset: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: '0.4', userSelect: 'none', zIndex: '0', textAlign: 'center' }}>
                <UploadIcon style={{ width: "36px", height: "36px", margin: "0 auto 8px auto" }} />
                <p style={{ margin: '0', fontSize: 'var(--text-sm)' }}>Load artwork below to customize</p>
              </div>
            )}

            {/* High Performance 2D Editor Hook Overlay */}
            <div 
              className="canvas-3d-frame"
              onMouseDown={onMouseDown}
              style={{ 
                position: 'relative',
                zIndex: '10',
                border: "1px solid var(--app-border)"
              }}
            >
              <ArtworkCanvas
                artworks={artworks}
                selectedArtworkId={selectedArtworkId}
                isDragging={isDragging}
                dieline={dieline}
                displaySize={DISPLAY_SIZE}
                onMouseDown={onMouseDown}
                onSelectArtwork={onSelectArtwork}
                isOutOfBounds={isOutOfBounds}
              />
            </div>
          </div>

          {/* Action Trigger Bars Footer Options */}
          <div style={{ paddingBlock: '16px', borderTop: '1px solid var(--app-border)', display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}
              >
                <PlusIcon style={{ width: "14px", height: "14px", marginRight: '6px', verticalAlign: 'middle' }} />
                Upload Design
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={onAddArtwork}
                style={{ display: 'none' }} 
              />
              
              {artworks.length > 0 && (
                <button 
                  onClick={() => selectedArtworkId && onRemoveArtwork(selectedArtworkId)}
                  className="btn-primary"
                  style={{ backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #fee2e2', padding: '8px 16px', fontSize: 'var(--text-xs)' }}
                >
                  <TrashIcon style={{ width: "14px", height: "14px", marginRight: '6px', verticalAlign: 'middle' }} />
                  Remove Selected
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 📦 RIGHT COLUMN PANEL: Immersive Real-Time 3D Viewport Inspection Hub */}
        <section className="designer-panel-card" style={{ display: 'flex', flexDirection: 'column', flex: '1', minHeight: '550px' }}>
          <div style={{ paddingBottom: '16px', borderBottom: '1px solid var(--app-border)' }}>
            <h2 style={{ margin: '0' }}>Live 3D Preview</h2>
          </div>

          {/* Responsive WebGL Scene Frame Viewport */}
          <div className="canvas-3d-frame" style={{ flexGrow: '1' }}>
            {modelUrl ? (
              <Suspense fallback={
                <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
                  Assembling 3D customizer container...
                </div>
              }>
                <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
                  <ambientLight intensity={0.2} />
                  <pointLight position={[10, 10, 10]} intensity={0.2} castShadow />
                  <Stage environment="warehouse" intensity={0.2} adjustCamera={false} shadows="contact">
                    <ModelViewport
                      modelUrl={modelUrl}
                      textureCanvas={textureCanvas}
                      packageColor={packageColor}
                    />
                  </Stage>
                  <OrbitControls enableZoom minDistance={0.1} maxDistance={0.5} />
                </Canvas>
              </Suspense>
            ) : (
              <div style={{ position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
                ⚠️ No matching mesh connected for preview
              </div>
            )}
          </div>

          {/* Core Controls Dashboard Panel Menu Sheet */}
          <div style={{ paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px', boxSizing: 'border-box' }}>
            
            {/* Color Matrix Controller Selector */}
            <div className="form-field-group" style={{ marginBottom: '0' }}>
              <label>Base Glaze Color</label>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => onColorChange("#F4F2EE")} style={{ width: '32px', height: '32px', borderRadius: '50%', border: packageColor === '#F4F2EE' ? '2px solid var(--app-btn-bg)' : '1px solid var(--app-border)', backgroundColor: "#F4F2EE", cursor: 'pointer' }} title="Ivory Matte" />
                  <button onClick={() => onColorChange("#E2E2E5")} style={{ width: '32px', height: '32px', borderRadius: '50%', border: packageColor === '#E2E2E5' ? '2px solid var(--app-btn-bg)' : '1px solid var(--app-border)', backgroundColor: "#E2E2E5", cursor: 'pointer' }} title="Slate Gray" />
                  <button onClick={() => onColorChange("#2C2E30")} style={{ width: '32px', height: '32px', borderRadius: '50%', border: packageColor === '#2C2E30' ? '2px solid var(--app-btn-bg)' : '1px solid var(--app-border)', backgroundColor: "#2C2E30", cursor: 'pointer' }} title="Onyx" />
                  <button onClick={() => onColorChange("#E6E2DC")} style={{ width: '32px', height: '32px', borderRadius: '50%', border: packageColor === '#E6E2DC' ? '2px solid var(--app-btn-bg)' : '1px solid var(--app-border)', backgroundColor: "#E6E2DC", cursor: 'pointer' }} title="Sandstone" />
                </div>

                {/* Extended Dynamic Custom Grid Palette Box */}
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--input-border-radius)', border: '1px solid var(--app-border)', background: 'transparent', cursor: 'pointer' }}
                    title="Pick Custom Color"
                  >
                    <MixerHorizontalIcon style={{ width: "16px", height: "16px", color: "currentColor" }} />
                  </button>

                  {isColorPickerOpen && (
                      <>
                        <div style={{ position: 'fixed', inset: '0', zIndex: '20' }} onClick={() => setIsColorPickerOpen(false)} />
                        <div style={{ position: 'absolute', bottom: '100%', marginBottom: '12px', left: '0', zIndex: '30' }}>
                          <ColorPicker 
                            value={packageColor}
                            onChange={onColorChange}
                          />
                        </div>
                      </>
                    )}
                </div>

                {/* Digital Precision HEX Form Vector */}
                <div style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: '1px solid var(--app-border)', borderRadius: 'var(--input-border-radius)', padding: '6px 12px' }}>
                  <span style={{ fontSize: 'var(--text-xs)', marginRight: '8px', opacity: '0.5', userSelect: 'none' }}>HEX</span>
                  <input 
                    type="text" 
                    value={packageColor}
                    onChange={(e) => onColorChange(e.target.value)}
                    style={{ border: 'none', padding: '0', width: '80px', fontSize: 'var(--text-xs)', fontWeight: 'bold', textTransform: 'uppercase' }} 
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>

            {/* Gloss Matrix Toggle Elements */}
            <div className="form-field-group" style={{ marginBottom: '0' }}>
              <label>Finish Texture</label>
              <div style={{ display: 'flex', padding: '4px', background: 'transparent', border: '1px solid var(--app-border)', borderRadius: 'var(--input-border-radius)', width: 'fit-content' }}>
                <button 
                  onClick={() => setActiveFinish('matte')}
                  style={{ padding: '6px 16px', borderRadius: 'var(--input-border-radius)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'semibold', background: activeFinish === 'matte' ? 'var(--app-btn-bg)' : 'transparent', color: activeFinish === 'matte' ? 'var(--app-btn-text)' : 'currentColor' }}
                >
                  Matte
                </button>
                <button 
                  onClick={() => setActiveFinish('gloss')}
                  style={{ padding: '6px 16px', borderRadius: 'var(--input-border-radius)', border: 'none', cursor: 'pointer', fontSize: 'var(--text-xs)', fontWeight: 'semibold', background: activeFinish === 'gloss' ? 'var(--app-btn-bg)' : 'transparent', color: activeFinish === 'gloss' ? 'var(--app-btn-text)' : 'currentColor' }}
                >
                  Gloss
                </button>
              </div>
            </div>

            {/* 🏁 INTEGRATED ACTION NAVIGATION BLOCK (Header Removed) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", borderTop: "1px solid var(--app-border)", paddingTop: "20px" }}>
              <button 
                onClick={onSave}
                className="btn-primary"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <BlendingModeIcon style={{ width: "16px", height: "16px" }} />
                Preview and Submit Enquiry
              </button>

              <button 
                type="button"
                onClick={onBack}
                className="btn-primary"
                style={{ 
                  width: "100%", 
                  backgroundColor: "transparent", 
                  color: "currentColor", 
                  border: "1px solid var(--app-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <ArrowLeftIcon style={{ width: "14px", height: "14px" }} />
                <span>Back to Product Selection</span>
              </button>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
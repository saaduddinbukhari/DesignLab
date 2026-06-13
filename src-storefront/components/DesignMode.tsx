import { Suspense } from "react";
import { startTransition } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ArtworkCanvas } from "./ArtworkCanvas";
import { ArtworkLayerList } from "./ArtworkLayerList";
import { ModelViewport } from "./ModelViewport";
import type { ArtworkObject, B2BProduct, DielineConfig } from "../types/customizer";

const DISPLAY_SIZE = 500;

interface DesignModeProps {
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
  onSave: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isOutOfBounds: (art: ArtworkObject) => boolean;
}

export function DesignMode({
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
}: DesignModeProps) {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Left panel */}
      <ArtworkLayerList
        artworks={artworks}
        selectedArtworkId={selectedArtworkId}
        dieline={dieline}
        packageColor={packageColor}
        currentScale={currentScale}
        onBack={onBack}
        onSelectArtwork={onSelectArtwork}
        onRemoveArtwork={onRemoveArtwork}
        onAddArtwork={onAddArtwork}
        onScaleChange={onScaleChange}
        onColorChange={onColorChange}
        onSave={onSave}
        isOutOfBounds={isOutOfBounds}
      />

      {/* 2D canvas */}
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

      {/* Floating 3D preview */}
      <div
        style={{
          position: "absolute",
          top: "24px",
          right: "24px",
          width: "300px",
          height: "240px",
          backgroundColor: "#fff",
          borderRadius: "16px",
          boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
          border: "1px solid #eef0f2",
          overflow: "hidden",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            backgroundColor: "#fafafa",
            padding: "10px 14px",
            borderBottom: "1px solid #eef0f2",
            fontSize: "11px",
            fontWeight: "700",
            color: "#666",
          }}
        >
          LIVE 3D PREVIEW
        </div>
        <div style={{ flex: 1, backgroundColor: "#eef0f2" }}>
          {modelUrl ? (
            <Suspense fallback={
              <div style={{ padding: "40px 10px", fontSize: "11px", color: "#666", textAlign: "center" }}>
                Preparing Preview...
              </div>
            }>
              <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 45 }}>
                <ambientLight intensity={0.2} />
                <pointLight position={[10, 10, 10]} intensity={0.2} castShadow />
                
                {/* adjustCamera={false} locked down to preserve your manual sizing configurations */}
                <Stage 
                  environment="warehouse" 
                  intensity={0.2} 
                  adjustCamera={false} 
                  shadows="contact"
                >
                  <ModelViewport
                    modelUrl={modelUrl}
                    textureCanvas={textureCanvas}
                    packageColor={packageColor}
                  />
                </Stage>
                <OrbitControls 
                  enableZoom 
                  minDistance={0.1} 
                  maxDistance={0.5} 
                />
              </Canvas>
            </Suspense>
          ) : (
            <div
              style={{
                padding: "40px 10px",
                fontSize: "11px",
                color: "#999",
                textAlign: "center",
              }}
            >
              No Mesh Connected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
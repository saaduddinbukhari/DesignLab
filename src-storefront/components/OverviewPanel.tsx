import { Suspense, useRef } from "react";
import { startTransition } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { useGLTF } from "@react-three/drei";
import type { B2BProduct, DielineConfig } from "../types/customizer";

interface OverviewPanelProps {
  product: B2BProduct;
  dieline: DielineConfig;
  modelUrl: string | null;
  onBack: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/** Simple read-only scene for the overview — no custom texture needed. */
function StaticScene({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} dispose={null} />;
}

export function OverviewPanel({
  product,
  dieline,
  modelUrl,
  onBack,
  onUpload,
}: OverviewPanelProps) {
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Left panel */}
      <div
        style={{
          width: "320px",
          backgroundColor: "#fff",
          borderRight: "1px solid #eef0f2",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          boxSizing: "border-box",
          flexShrink: 0,
          zIndex: 10,
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
          ← Back to Collection
        </button>

        <h2
          style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 4px 0" }}
        >
          Upload Artwork
        </h2>
        <p
          style={{
            fontSize: "12px",
            color: "#8c8c8c",
            margin: "0 0 24px 0",
          }}
        >
          Upload your logo or design to place on the packaging
        </p>

        {/* Dieline status badge */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: product.dielineConfig ? "#f0fdf4" : "#fff8f0",
            border: `1px solid ${
              product.dielineConfig ? "#bbf7d0" : "#fde68a"
            }`,
            marginBottom: "20px",
            fontSize: "11px",
            color: product.dielineConfig ? "#166534" : "#92400e",
          }}
        >
          {product.dielineConfig
            ? `✅ Dieline configured (${dieline.printW}×${dieline.printH}px print zone)`
            : "⚠️ No dieline_config metafield found — using full canvas fallback"}
        </div>

        {/* Upload drop zone */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <input
            type="file"
            accept="image/*"
            onChange={onUpload}
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: "pointer",
              zIndex: 2,
            }}
          />
          <div
            style={{
              height: "160px",
              border: "2px dashed #8b5cf6",
              borderRadius: "12px",
              backgroundColor: "#f5f3ff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                color: "#8b5cf6",
                marginBottom: "4px",
              }}
            >
              📤
            </div>
            <span
              style={{ fontSize: "14px", fontWeight: "600", color: "#8b5cf6" }}
            >
              Click to Upload
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#a78bfa",
                marginTop: "4px",
              }}
            >
              PNG or JPG, up to 10MB
            </span>
          </div>
        </div>

        <hr
          style={{
            border: "none",
            borderTop: "1px solid #f0f0f0",
            margin: "12px 0 24px 0",
          }}
        />
        <div style={{ fontSize: "14px", fontWeight: "600" }}>
          {product.title}
        </div>
        {product.moq?.value && (
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "4px",
            }}
          >
            Minimum Order Quantity: <strong>{product.moq.value} units</strong>
          </div>
        )}
      </div>

      {/* 3D viewer */}
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          backgroundColor: "#eef0f2",
        }}
      >
        {modelUrl ? (
          <Suspense fallback={
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#666" }}>
              Initializing 3D Asset...
            </div>
          }>
            <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[30, 30, 30]} intensity={0.2} castShadow />
              {/* adjustCamera={false} keeps Drei from overriding your strict manual limits */}
              <Stage 
                environment="warehouse" 
                intensity={0.2} 
                adjustCamera={false} 
                shadows="contact" 
                shadowBias={-0.001}
              >
                <StaticScene modelUrl={modelUrl} />
              </Stage>
              <OrbitControls 
                ref={controlsRef} 
                enableZoom 
                minDistance={0.2} 
                maxDistance={0.5} 
              />
            </Canvas>
          </Suspense>
        ) : (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              color: "#666",
              textAlign: "center",
            }}
          >
            ⚠️ No 3D model found.
            <br />
            <span style={{ fontSize: "12px", color: "#999" }}>
              Upload a .glb in Shopify Admin → Products.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
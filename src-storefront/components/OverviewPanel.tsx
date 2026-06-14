import { Suspense, useRef, useState, startTransition } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
// 💡 Import our dynamic spinning StaticScene engine
import { StaticScene } from "./ModelViewport"; 
import type { B2BProduct, DielineConfig } from "../types/customizer";

interface OverviewPanelProps {
  product: B2BProduct;
  dieline: DielineConfig;
  modelUrl: string | null;
  onBack: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function OverviewPanel({
  product,
  dieline,
  modelUrl,
  onBack,
  onUpload,
}: OverviewPanelProps) {
  const controlsRef = useRef<any>(null);
  
  // 💡 State tracking the dynamic switch toggle selection (Defaults to OFF)
  const [isAutoRotating, setIsAutoRotating] = useState(false);

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel layout wrapper */}
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
            color: "#6e7a73",
            fontSize: "13px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginBottom: "24px",
            padding: 0,
          }}
        >
          ← Back to Products
        </button>

        {/* 💡 CUSTOMER INTERACTION UPGRADE: Swapped text copy labels to drop dev jargon */}
        <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px 0", color: "#181c1f", letterSpacing: "-0.01em" }}>
          Design This Product
        </h2>
        <p style={{ fontSize: "12px", color: "#8c8c8c", margin: "0 0 24px 0", lineHeight: "1.4" }}>
          Upload your graphics or logo configurations to map out a production layout.
        </p>

        {/* Dieline status badge */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            backgroundColor: product.dielineConfig ? "#f0fdf4" : "#fff8f0",
            border: `1px solid ${product.dielineConfig ? "#bbf7d0" : "#fde68a"}`,
            marginBottom: "20px",
            fontSize: "11px",
            fontWeight: "500",
            color: product.dielineConfig ? "#166534" : "#92400e",
          }}
        >
          {product.dielineConfig
            ? `✅ Canvas aligned (${dieline.printW}×${dieline.printH}px design zone)`
            : "⚠️ Setting up custom bounding boundaries — utilizing asset viewport fallback"}
        </div>

        {/* Upload drop zone interaction card */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
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
              height: "150px",
              border: "2px dashed #8455ef",
              borderRadius: "14px",
              backgroundColor: "#f8f9ff",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              transition: "all 0.2s ease"
            }}
          >
            <div style={{ fontSize: "26px", marginBottom: "6px" }}>📤</div>
            <span style={{ fontSize: "14px", fontWeight: "600", color: "#6b38d4" }}>
              Click to Upload
            </span>
            <span style={{ fontSize: "11px", color: "#8455ef", opacity: 0.7, marginTop: "4px" }}>
              PNG, JPG or SVG vectors up to 10MB
            </span>
          </div>
        </div>

        {/* 💡 PREMIUM ADDITION: 360 Rotation Control Toggle Switch Row Container */}
        <div 
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            backgroundColor: "#f1f4f8",
            borderRadius: "12px",
            border: "1px solid #dfe3e7",
            marginBottom: "16px"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "#181c1f" }}>
              Perpetual 360° Spin
            </span>
            <span style={{ fontSize: "10px", color: "#6e7a73" }}>
              Rotate model continuously
            </span>
          </div>

          <label style={{ position: "relative", display: "inline-block", width: "40px", height: "22px", cursor: "pointer", margin: 0 }}>
            <input 
              type="checkbox" 
              checked={isAutoRotating}
              onChange={(e) => setIsAutoRotating(e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }} 
            />
            <span style={{
              position: "absolute", inset: 0,
              backgroundColor: isAutoRotating ? "#00654b" : "#bdc9c2",
              transition: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "22px"
            }} />
            <span style={{
              position: "absolute", content: "''",
              height: "16px", width: "16px", left: "3px", bottom: "3px",
              backgroundColor: "#ffffff",
              transition: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
              borderRadius: "50%",
              transform: isAutoRotating ? "translateX(18px)" : "translateX(0)"
            }} />
          </label>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", margin: "10px 0 20px 0" }} />
        
        {/* Product Information Footer card summary */}
        <div style={{ fontSize: "14px", fontWeight: "600", color: "#181c1f" }}>
          {product.title}
        </div>
        {product.moq?.value && (
          <div style={{ fontSize: "12px", color: "#3e4944", marginTop: "4px" }}>
            Minimum Order Quantity: <strong style={{ color: "#181c1f" }}>{product.moq.value} units</strong>
          </div>
        )}
      </div>

      {/* 3D viewer right viewport panel container */}
      <div
        style={{
          flex: 1,
          height: "100%",
          position: "relative",
          backgroundColor: "#f6fafe",
        }}
      >
        {modelUrl ? (
          <Suspense fallback={
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#3e4944", fontSize: "13px", fontWeight: "500" }}>
              Assembling 3D customizer container assets...
            </div>
          }>
            <Canvas shadows camera={{ position: [0, 1.5, 4], fov: 45 }}>
              <ambientLight intensity={0.2} />
              <pointLight position={[30, 30, 30]} intensity={0.2} castShadow />
              <Stage 
                environment="warehouse" 
                intensity={0.2} 
                adjustCamera={false} 
                shadows="contact" 
                shadowBias={-0.001}
              >
                {/* 💡 Pass down toggle configuration tracking state directly to the mesh scene animation compiler */}
                <StaticScene modelUrl={modelUrl} isAutoRotating={isAutoRotating} />
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
              color: "#6e7a73",
              textAlign: "center",
              fontSize: "13px"
            }}
          >
            ⚠️ No 3D asset link mapped for this entry.
            <br />
            <span style={{ fontSize: "11px", color: "#8c8c8c" }}>
              Upload a matching .glb file directly inside Shopify Admin Products.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
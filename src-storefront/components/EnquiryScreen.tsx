import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "./ModelViewport"; // 💡 Connects straight to your real-time 3D engine hook
import { 
  DrawingPinIcon, 
  ActivityLogIcon, 
  LayersIcon, 
  PaperPlaneIcon,
  ArrowLeftIcon
} from "@radix-ui/react-icons";
import type { B2BProduct } from "../types/customizer";

interface EnquiryScreenProps {
  product: B2BProduct;
  packageColor: string;
  textureCanvas: HTMLCanvasElement | null;
  modelUrl: string | null;
  onBack: () => void;
  onSubmitEnquiry: (formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    designSnapshot: string; 
    quantity: string; // 💡 Added explicitly to override the baseline MOQ value upstream
  }) => void;
}

export function EnquiryScreen({
  product,
  packageColor,
  textureCanvas,
  modelUrl,
  onBack,
  onSubmitEnquiry,
}: EnquiryScreenProps) {
  
  // Parse Minimum Order Quantity safely out of Shopify's integer metafield
  const minimumOrderQuantity = parseInt(product.moq?.value || "20", 10);

  // 📝 Form Fields Tracking State
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState(""); // 💡 Track local postal code details
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [quantity, setQuantity] = useState<number>(minimumOrderQuantity); // 💡 Initialize with true MOQ bounds
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 💡 4K RESOLUTION TEXTURE BAKE STRATEGY ENGINE LOOP
  const generate4KBakePayload = (): string => {
    if (!textureCanvas) return "";
    
    const bakeCanvas = document.createElement("canvas");
    bakeCanvas.width = 4096;  
    bakeCanvas.height = 4096;  
    const ctx = bakeCanvas.getContext("2d");
    
    if (!ctx) return "";

    ctx.drawImage(textureCanvas, 0, 0, 4096, 4096);
    return bakeCanvas.toDataURL("image/png", 1.0);
  };

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 💡 GUARD RAIL VALIDATION: Ensure custom quantity remains strictly above or equal to MOQ specifications
    if (quantity < minimumOrderQuantity) {
      alert(`Minimum order requirement constraint issue: This product line demands a batch of at least ${minimumOrderQuantity} units to authorize an industrial custom manufacturing run.`);
      return;
    }

    if (!name || !email || !phone || !address || !pincode) {
      alert("Please check your contact fields. Full Name, Email, Phone, Shipping Address, and Pincode are all required.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Compile 4K matrix
      const highResBase64 = generate4KBakePayload();
      if (!highResBase64) {
        throw new Error("Failed to compile canvas snapshot.");
      }

      // 2. Convert raw data string to native binary Blob array bytes safely
      const splitData = highResBase64.split(",");
      const byteString = atob(splitData[1]);
      const mimeString = splitData[0].split(":")[1].split(";")[0];
      
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      
      const fileBlob = new Blob([arrayBuffer], { type: mimeString });

      const imageFormData = new FormData();
      imageFormData.append("file", fileBlob, `designlab-${Date.now()}-print.png`);
      imageFormData.append("upload_preset", "Designlab");

      let directImageUrl = "https://placehold.co/4096.png?text=Cloudinary+Upload+Error";
      
      try {
        const uploadResponse = await fetch("https://api.cloudinary.com/v1_1/dkfhlfiwl/image/upload", {
          method: "POST",
          body: imageFormData
        });
        const uploadJson = await uploadResponse.json();
        
        if (uploadJson.secure_url) {
          directImageUrl = uploadJson.secure_url;
        } else if (uploadJson.error) {
          console.error("Cloudinary Error Log:", uploadJson.error.message);
        }
      } catch (uploadErr) {
        console.warn("Public background storage channel exception:", uploadErr);
      }
      
      // 3. Complete structural submission handshake upstream
      await onSubmitEnquiry({
        name,
        email,
        phone,
        address: `${address} - Pincode: ${pincode}`,
        notes,
        designSnapshot: directImageUrl,
        quantity: quantity.toString() // Upstream tunnel deployment string
      });
    } catch (err) {
      console.error("Inquiry pipeline break:", err);
      alert("Something went wrong processing your drawing canvas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="client-3d-designer-extension" 
      style={{ width: "100%", paddingBottom: "40px", boxSizing: "border-box" }}
    >
      {/* 🎛️ Main Split Screen Framework Workspace */}
      <main className="main-framework-grid" style={{ marginBottom: "20px" }}>
        
        {/* 📦 LEFT COLUMN: Immersive Real-Time 3D Viewport Gallery Section */}
        <section className="designer-panel-card" style={{ display: "flex", flexDirection: "column", flex: "1.2", minHeight: "550px" }}>
          <div style={{ paddingBottom: "16px", borderBottom: "1px solid var(--app-border)" }}>
            <h2 style={{ margin: "0" }}>Review Your Design</h2>
          </div>

          <div className="canvas-3d-frame" style={{ flexGrow: "1", position: "relative", minHeight: "450px" }}>
            {modelUrl ? (
              <Suspense fallback={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "var(--text-xs)", opacity: 0.6 }}>Preparing preview snapshot...</div>}>
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
              <div style={{ fontSize: "var(--text-xs)", opacity: 0.5, padding: "24px", position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>⚠️ Preview data unlinked</div>
            )}
          </div>
          
          <div style={{ padding: "16px", borderTop: "1px solid var(--app-border)", textAlign: "center" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "600", letterSpacing: "var(--text-letter-spacing)", opacity: 0.6, textTransform: "uppercase" }}>Rotate model to inspect placement angles</span>
          </div>
        </section>

        {/* 📝 RIGHT COLUMN: Specifications Bento & Contact Data Sheet Form */}
        <aside className="designer-panel-card" style={{ display: "flex", flexDirection: "column", flex: "1", boxSizing: "border-box" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Branding Specifications Header Row */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "1px", backgroundColor: "var(--app-border)" }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: "600", opacity: 0.5, textTransform: "uppercase", letterSpacing: "var(--heading-letter-spacing)" }}>Your Specification Summary</span>
              </div>
              <h1 style={{ margin: "4px 0 0 0" }}>{product.title}</h1>
              <p style={{ fontSize: "var(--text-sm)", opacity: 0.6, margin: 0, fontWeight: "500", textTransform: "uppercase" }}>{product.productType || "MUGS & TUMBLERS"}</p>
            </div>

            {/* 🍱 PRODUCT SPECIFICATIONS DATA BENTO ROW */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ padding: "12px", backgroundColor: "rgba(var(--text-color) / 0.03)", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <DrawingPinIcon style={{ color: "currentColor", width: "14px", height: "14px", opacity: 0.7 }} />
                <h4 style={{ fontSize: "var(--text-xs)", color: "var(--app-text)", opacity: 0.5, textTransform: "uppercase", margin: 0 }}>Material</h4>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {(product as any).material?.value || "Stoneware Clay"}
                </div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "rgba(var(--text-color) / 0.03)", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <ActivityLogIcon style={{ color: "currentColor", width: "14px", height: "14px", opacity: 0.7 }} />
                <h4 style={{ fontSize: "var(--text-xs)", color: "var(--app-text)", opacity: 0.5, textTransform: "uppercase", margin: 0 }}>Size</h4>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {(product as any).volumeSize?.value || "3oz / 90ml"}
                </div>
              </div>
              <div style={{ padding: "12px", backgroundColor: "rgba(var(--text-color) / 0.03)", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <LayersIcon style={{ color: "currentColor", width: "14px", height: "14px", opacity: 0.7 }} />
                <h4 style={{ fontSize: "var(--text-xs)", color: "var(--app-text)", opacity: 0.5, textTransform: "uppercase", margin: 0 }}>Min Order</h4>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {minimumOrderQuantity} Units
                </div>
              </div>
            </div>

            {/* Form Fields Processing Node */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--app-border)" }}>
              <form style={{ display: "flex", flexDirection: "column", gap: "16px" }} onSubmit={handleFormSubmission}>
                
                <div className="form-field-group">
                  <label>Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter contact name" type="text" style={{ width: "100%" }} />
                </div>
                
                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <div className="form-field-group" style={{ flex: "2", marginBottom: 0 }}>
                    <label>Shipping Address</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery destination" type="text" style={{ width: "100%" }} />
                  </div>
                  <div className="form-field-group" style={{ flex: "1", marginBottom: 0 }}>
                    <label>Pincode</label>
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="Zip" type="text" maxLength={10} style={{ width: "100%" }} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", width: "100%" }}>
                  <div className="form-field-group" style={{ flex: "1", marginBottom: 0 }}>
                    <label>Phone Number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." type="tel" style={{ width: "100%" }} />
                  </div>
                  <div className="form-field-group" style={{ flex: "1", marginBottom: 0 }}>
                    <label>Email Address</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="work@brand.com" type="email" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* 💡 QUANTITY BLOCK WITH PROTECTION */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px", backgroundColor: "transparent", borderRadius: "var(--input-border-radius)", border: "1px solid var(--app-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ margin: 0 }}>Batch Quantity Units</label>
                    <span style={{ fontSize: "10px", fontWeight: "600", opacity: 0.6, backgroundColor: "rgba(var(--text-color) / 0.04)", padding: "2px 8px", borderRadius: "var(--input-border-radius)", border: "1px solid var(--app-border)" }}>
                      MOQ Required: {minimumOrderQuantity}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(minimumOrderQuantity, prev - 10))}
                      style={{ width: "36px", height: "36px", border: "1px solid var(--app-border)", background: "transparent", color: "currentColor", borderRadius: "var(--input-border-radius)", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuantity(isNaN(val) ? minimumOrderQuantity : val);
                      }}
                      onBlur={() => {
                        if (quantity < minimumOrderQuantity) {
                          setQuantity(minimumOrderQuantity);
                        }
                      }}
                      style={{ flex: 1, textAlign: "center", height: "36px", fontSize: "var(--text-sm)", fontWeight: "bold", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", background: "transparent", color: "currentColor" }}
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 10)}
                      style={{ width: "36px", height: "36px", border: "1px solid var(--app-border)", background: "transparent", color: "currentColor", borderRadius: "var(--input-border-radius)", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", userSelect: "none" }}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="form-field-group">
                  <label>Additional Requests</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Specify unique printing preferences..." rows={3} style={{ width: "100%", resize: "none" }} />
                </div>

                {/* 🏁 INTEGRATED ACTION TRIGGERS (Header/Footer Eliminated) */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px", width: "100%" }}>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                  >
                    <PaperPlaneIcon style={{ width: "14px", height: "14px", color: "currentColor" }} />
                    <span>{isSubmitting ? "Uploading Map Layer..." : "Submit Wholesale Enquiry"}</span>
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
                    <span>Back to Studio Edit</span>
                  </button>
                </div>

              </form>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
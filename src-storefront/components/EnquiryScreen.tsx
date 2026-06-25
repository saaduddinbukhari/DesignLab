import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "./ModelViewport"; 
import { 
  ArrowLeftIcon, 
  DrawingPinIcon, 
  ActivityLogIcon, 
  LayersIcon, 
  PaperPlaneIcon 
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
      alert(`Minimum order requirement constraint issue: This product line demands a baseline batch of at least ${minimumOrderQuantity} units to authorize an industrial custom manufacturing run.`);
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
        // 💡 Combine address and pincode cleanly so it aggregates nicely into the draft order data sheets
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
      className="min-h-screen flex flex-col w-full bg-[#fdf9f3] relative overflow-hidden"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      
      {/* 🧭 TopAppBar Navigation Row */}
      <header className="bg-white border-b border-gray-100 fixed top-0 left-0 w-full z-50 shadow-sm h-16 flex items-center justify-between px-6 box-border">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="hover:bg-gray-50 p-2 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all group"
          >
            <ArrowLeftIcon style={{ width: "20px", height: "20px", color: "#5e5e5c" }} className="group-hover:text-black" />
          </button>
          <span className="text-sm font-semibold text-[#17191b] uppercase tracking-wider select-none">
            Preview and Submit
          </span>
        </div>
        <div className="w-10 h-10" />
      </header>

      {/* 🎛️ Main Split Screen Framework Workspace */}
      <main className="pt-16 flex-grow flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden box-border">
        
        {/* 📦 LEFT COLUMN: Immersive Real-Time 3D Viewport Gallery Section */}
        <section className="relative w-full md:w-3/5 h-[45vh] md:h-full bg-[#f7f3ed] flex items-center justify-center overflow-hidden">
          <div className="w-full h-full bg-[#ddd9d4]">
            {modelUrl ? (
              <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Preparing preview snapshot...</div>}>
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
              <div className="text-xs text-gray-400">⚠️ Preview data unlinked</div>
            )}
          </div>
          
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 to-transparent" />
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 shadow-sm pointer-events-none">
            <span className="text-[11px] font-bold tracking-wider text-[#5e5e5c] uppercase">Rotate to inspect layout angles</span>
          </div>
        </section>

        {/* 📝 RIGHT COLUMN: Dynamic Metafields Attributes Bento & Contact Data Sheet Form */}
        <aside className="w-full md:w-2/5 p-6 md:p-8 flex flex-col justify-between bg-[#fdf9f3] z-10 overflow-y-auto no-scrollbar h-full pb-32 box-border">
          <div className="max-w-md mx-auto md:mx-0 w-full space-y-8">
            
            {/* Branding Specifications Header Row */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-[1px] bg-gray-300" />
                <span className="text-[11px] font-bold text-[#5e5e5c] uppercase tracking-widest">Your Final Design</span>
              </div>
              <h1 className="text-4xl font-extrabold text-[#17191b] leading-tight m-0 tracking-tight">{product.title}</h1>
              <p className="text-base text-[#5e5e5c] m-0 font-medium">{product.productType || "MUGS & TUMBLERS"}</p>
            </div>

            {/* 🍱 PRODUCT SPECIFICATIONS DATA BENTO ROW */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <DrawingPinIcon className="text-[#17191b] w-4 h-4 mb-2" />
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider m-0">Material</h3>
                <p className="text-xs font-bold text-[#17191b] m-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {(product as any).material?.value || "Stoneware Clay"}
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <ActivityLogIcon className="text-[#17191b] w-4 h-4 mb-2" />
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider m-0">Size</h3>
                <p className="text-xs font-bold text-[#17191b] m-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {(product as any).volumeSize?.value || "3oz / 90ml"}
                </p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <LayersIcon className="text-[#17191b] w-4 h-4 mb-2" />
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider m-0">Min Order</h3>
                <p className="text-xs font-bold text-[#17191b] m-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {minimumOrderQuantity} Units
                </p>
              </div>
            </div>

            {/* Form Fields Processing Node */}
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#17191b] uppercase tracking-wider m-0">Enquiry Details</h3>
                <div className="h-[1px] w-full bg-gray-200/50" />
              </div>

              <form className="space-y-4" onSubmit={handleFormSubmission}>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#5e5e5c]">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors" placeholder="Enter contact name" type="text" />
                </div>
                
                {/* 💡 Sized and Aligned Address & Pincode Split Row Row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e5e5c]">Shipping Address</label>
                    <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors" placeholder="Enter delivery destination" type="text" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e5e5c]">Pincode</label>
                    <input value={pincode} onChange={(e) => setPincode(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors" placeholder="Zip/Pin" type="text" maxLength={10} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e5e5c]">Phone Number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors" placeholder="+91..." type="tel" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#5e5e5c]">Email Address</label>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors" placeholder="work@brand.com" type="email" />
                  </div>
                </div>

                {/* 💡 QUANTITY BLOCK WITH INTEGRATED MOQ IN-LINE ENGINE TRACKING PROTECTION */}
                <div className="flex flex-col gap-1 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-[#17191b] uppercase tracking-wider">Batch Quantity Units</label>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      MOQ Required: {minimumOrderQuantity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => Math.max(minimumOrderQuantity, prev - 10))}
                      className="w-10 h-10 bg-[#f7f3ed] border border-gray-200 rounded-lg font-bold text-[#17191b] hover:bg-gray-200 flex items-center justify-center cursor-pointer select-none transition-colors border-none text-base"
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
                      className="flex-1 text-center bg-[#f7f3ed] border border-gray-200 rounded-lg h-10 text-sm font-bold text-[#17191b] outline-none focus:border-black transition-colors box-border"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(prev => prev + 10)}
                      className="w-10 h-10 bg-[#f7f3ed] border border-gray-200 rounded-lg font-bold text-[#17191b] hover:bg-gray-200 flex items-center justify-center cursor-pointer select-none transition-colors border-none text-base"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#5e5e5c]">Additional Requests</label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#f7f3ed] border border-gray-200 rounded-lg px-3 py-2 text-sm text-[#17191b] outline-none focus:border-black transition-colors resize-none" placeholder="Specify required batch quantities or unique printing preferences..." rows={4} />
                </div>
              </form>
            </div>
          </div>
        </aside>
      </main>

      {/* 🏁 Bottom Fixed Action Sheet Wrapper */}
      <footer className="fixed bottom-0 left-0 w-full z-50 flex items-center justify-center p-4 bg-white border-t border-gray-100 shadow-md box-border">
        <div className="max-w-[1280px] w-full flex items-center justify-between">
          <div className="hidden sm:flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">PROJECT REF</span>
            <span className="text-xs font-bold text-[#17191b]">DL-2026-CERAMIC-B2B</span>
          </div>
          <div>
            <button 
              onClick={handleFormSubmission}
              disabled={isSubmitting}
              className="bg-[#17191b] text-white px-8 py-3.5 rounded-lg text-xs font-bold flex items-center gap-2 border-none cursor-pointer transition-all active:scale-98 shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Uploading Map Layer..." : "Submit Wholesale Enquiry"}</span>
              <PaperPlaneIcon style={{ width: "14px", height: "14px" }} />
            </button>
          </div>
        </div>
      </footer>
      
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.02]" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }} />
    </div>
  );
}
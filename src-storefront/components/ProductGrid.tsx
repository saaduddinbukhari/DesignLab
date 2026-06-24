import { useState, useEffect } from "react";
import type { B2BProduct } from "../types/customizer";
// 💡 SECURED: Kept your exact import and cleanly added GridIcon and BackpackIcon from the same library
import { LayersIcon, Cross2Icon, BlendingModeIcon, GridIcon, BackpackIcon } from "@radix-ui/react-icons"; 

interface ProductGridProps {
  products: B2BProduct[];
  onSelectProduct: (product: B2BProduct) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  // 🎛️ Welcome Introduction Modal State Management Tracking Toggles
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [isWelcomeAnimating, setIsWelcomeAnimating] = useState(false);

  // 🎛️ Details Selection Expansion Modal State Toggles
  const [selectedModalProduct, setSelectedModalProduct] = useState<B2BProduct | null>(null);
  const [isModalAnimating, setIsModalAnimating] = useState(false);

  // Trigger smooth fade-in scale tracking variables for welcome window block on load mount
  useEffect(() => {
    const animationTimeout = setTimeout(() => setIsWelcomeAnimating(true), 100);
    return () => clearTimeout(animationTimeout);
  }, []);

  const handleCloseWelcome = () => {
    setIsWelcomeAnimating(false);
    setTimeout(() => setIsWelcomeOpen(false), 400);
  };

  const handleCardClick = (product: B2BProduct) => {
    setSelectedModalProduct(product);
    setTimeout(() => setIsModalAnimating(true), 50);
  };

  const handleCloseModal = () => {
    setIsModalAnimating(false);
    setTimeout(() => setSelectedModalProduct(null), 300);
  };

  return (
    <div 
      style={{ 
        width: "100%", 
        height: "100%", 
        backgroundColor: "#fdf9f3", // Pure Stitch text element color tokens match
        fontFamily: "'Manrope', sans-serif",
        overflowY: "auto",
        padding: "48px 24px"
      }}
    >
      {/* 📦 Main Catalog Grid Frame Container Box */}
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <header style={{ nobilityContext: "none", marginBottom: "40px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "14px", color: "#636360", fontWeight: "500" }}>
            Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
          </div>
        </header>

        <main>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "32px",
            }}
          >
            {products.map((prod) => {
              const assetImage = (prod as any).image || "https://placehold.co/400x400?text=No+Image";

              return (
                <div
                  key={prod.id}
                  onClick={() => handleCardClick(prod)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0px 4px 20px rgba(44, 46, 48, 0.04)",
                    border: "1px solid rgba(26, 25, 22, 0.05)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow = "0px 8px 30px rgba(44, 46, 48, 0.10)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0px 4px 20px rgba(44, 46, 48, 0.04)";
                  }}
                >
                  <div style={{ aspectRatio: "1/1", backgroundColor: "#f2ede7", overflow: "hidden", borderBottom: "1px solid rgba(26, 25, 22, 0.05)" }}>
                    <img
                      src={assetImage}
                      alt={prod.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em", color: "#5e5e5c" }}>
                      {prod.productType || "MUGS & TUMBLERS"}
                    </div>
                    
                    <div style={{ fontSize: "20px", fontWeight: "600", color: "#17191b", margin: "2px 0" }}>
                      {prod.title}
                    </div>

                    <p style={{ fontSize: "14px", color: "#636360", lineHeight: "1.6", margin: "0 0 12px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {prod.description || "Create your bespoke corporate layouts interactively on this item inside our live studio customizer mesh suite."}
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "#f7f3ed", border: "1px solid rgba(197, 198, 202, 0.3)", borderRadius: "8px", padding: "8px 12px", marginTop: "auto", alignSelf: "flex-start" }}>
                      <LayersIcon style={{ width: "14px", height: "14px", color: "#474744" }} />
                      <span style={{ fontSize: "14px", color: "#5e5e5c", fontWeight: "500" }}>
                        Min Order: <strong style={{ color: "#1c1c18", fontWeight: "600" }}>{prod.moq?.value || "20"} units</strong>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* 🛎️ EXPANSION PRODUCT DETAIL MODAL LAYER */}
      {selectedModalProduct && (
        <div 
          style={{
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", boxSizing: "border-box", backdropFilter: "blur(8px)", backgroundColor: "rgba(23, 25, 27, 0.2)",
            opacity: isModalAnimating ? 1 : 0, visibility: isModalAnimating ? "visible" : "hidden", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onClick={handleCloseModal}
        >
          <div 
            style={{
              position: "relative", backgroundColor: "#ffffff", width: "100%", maxWidth: "1280px", maxHeight: "90vh", borderRadius: "16px", boxShadow: "0px 12px 60px rgba(44, 46, 48, 0.15)", overflow: "hidden", display: "flex", flexDirection: "row", alignItems: "stretch",
              transform: isModalAnimating ? "scale(1)" : "scale(0.95)", transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleCloseModal} style={{ position: "absolute", top: "16px", right: "16px", zIndex: 1100, backgroundColor: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0px 4px 20px rgba(44, 46, 48, 0.06)" }}>
              <Cross2Icon style={{ width: "16px", height: "16px", color: "#17191b" }} />
            </button>

            <div style={{ width: "60%", backgroundColor: "#f2ede7", overflow: "hidden" }}>
              <img src={(selectedModalProduct as any).image || "https://placehold.co/600x600?text=No+Image"} alt={selectedModalProduct.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <div style={{ width: "40%", padding: "48px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "#ffffff", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: "500", textTransform: "uppercase", letterSpacing: "0.1em", color: "#5e5e5c" }}>{selectedModalProduct.productType || "MUGS & TUMBLERS"}</span>
                  <h1 style={{ fontSize: "40px", fontWeight: "700", color: "#17191b", margin: "8px 0 0 0", letterSpacing: "-0.02em", lineHeight: "1.1" }}>{selectedModalProduct.title}</h1>
                </div>
                <div style={{ display: "inline-flex", alignSelf: "flex-start", backgroundColor: "#f7f3ed", border: "1px solid rgba(197, 198, 202, 0.3)", borderRadius: "6px", padding: "6px 12px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "500", color: "#5e5e5c" }}>₹ Rates tailored to your design</span>
                </div>
                <p style={{ fontSize: "16px", color: "#636360", lineHeight: "1.6", margin: 0 }}>{selectedModalProduct.description || "Crafted from fine-grained stoneware with a soft, matte cream glaze."}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "24px", borderTop: "1px solid #e6e2dc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#2c2c2c" }}>Volume/Size</span>
                    <span style={{ fontSize: "14px", color: "#5e5e5c" }}>{(selectedModalProduct as any).volumeSize?.value || "3oz / 90ml"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#2c2c2c" }}>Material</span>
                    <span style={{ fontSize: "14px", color: "#5e5e5c" }}>{(selectedModalProduct as any).material?.value || "Stoneware Clay"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#2c2c2c" }}>Minimum Order</span>
                    <span style={{ fontSize: "14px", color: "#5e5e5c", fontWeight: "600" }}>{selectedModalProduct.moq?.value || "20"} units</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "48px" }}>
                <button onClick={() => { handleCloseModal(); onSelectProduct(selectedModalProduct); }} style={{ width: "100%", backgroundColor: "#17191b", color: "#ffffff", fontSize: "14px", fontWeight: "600", padding: "16px", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: "0px 4px 20px rgba(44, 46, 48, 0.06)" }}>
                  <BlendingModeIcon style={{ width: "16px", height: "16px" }} /> Design this product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎛️ THE WELCOME INTRODUCTION POPUP MODAL OVERLAY SHEET */}
      {isWelcomeOpen && (
        <div 
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200, // Anchored structural placement sitting above all overlay matrices
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            boxSizing: "border-box",
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(23, 25, 27, 0.2)",
            opacity: isWelcomeAnimating ? 1 : 0,
            visibility: isWelcomeAnimating ? "visible" : "hidden",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          {/* Welcome Card Box Container context wrapper */}
          <div 
            style={{
              backgroundColor: "#ffffff",
              width: "100%",
              maxWidth: "500px",
              borderRadius: "12px",
              boxShadow: "0px 12px 60px rgba(44, 46, 48, 0.15)",
              padding: "32px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              transform: isWelcomeAnimating ? "scale(1)" : "scale(0.95)",
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            {/* Header Text Segment */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: "600", color: "#17191b", margin: 0, letterSpacing: "-0.01em" }}>
                Welcome to Design Lab
              </h2>
              <p style={{ fontSize: "16px", color: "#5e5e5c", margin: 0 }}>
                Your creative journey starts here.
              </p>
            </div>

            {/* Feature Guideline Informative Rows Lists */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "8px 0" }}>
              
              {/* Row 1: Canvas selection tracking node */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "#f7f3ed", padding: "11px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {/* 💡 FIXED: Replaced standard text glyph with pure Radix GridIcon */}
                  <GridIcon style={{ width: "20px", height: "20px", color: "#17191b" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#17191b", margin: "0 0 2px 0" }}>Select Your Canvas</h3>
                  <p style={{ fontSize: "14px", color: "#636360", margin: 0, lineHeight: "1.4" }}>Choose any product from our collection to begin.</p>
                </div>
              </div>

              {/* Row 2: Personalize layout parameter configs */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "#f7f3ed", padding: "11px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {/* 💡 FIXED: Replaced standard text glyph with pure Radix BlendingModeIcon */}
                  <BlendingModeIcon style={{ width: "20px", height: "20px", color: "#17191b" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#17191b", margin: "0 0 2px 0" }}>Personalize Your Piece</h3>
                  <p style={{ fontSize: "14px", color: "#636360", margin: 0, lineHeight: "1.4" }}>Experiment with different color options and upload your own unique designs.</p>
                </div>
              </div>

              {/* Row 3: Bulk ordering tracking summaries */}
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "#f7f3ed", padding: "11px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {/* 💡 FIXED: Replaced standard text glyph with pure Radix BackpackIcon */}
                  <BackpackIcon style={{ width: "20px", height: "20px", color: "#17191b" }} />
                </div>
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#17191b", margin: "0 0 2px 0" }}>Bulk Ordering</h3>
                  <p style={{ fontSize: "14px", color: "#636360", margin: 0, lineHeight: "1.4" }}>Finalize your design and place high-volume orders with ease.</p>
                </div>
              </div>

            </div>

            {/* Dismiss trigger CTA Button element alignment */}
            <button 
              onClick={handleCloseWelcome}
              style={{
                width: "100%",
                backgroundColor: "#17191b",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                padding: "16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0px 4px 20px rgba(44, 46, 48, 0.06)",
                transition: "transform 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              Get Started
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
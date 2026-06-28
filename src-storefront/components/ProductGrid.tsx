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
        backgroundColor: "var(--app-bg)", // 💡 INHERITED: Prestige background variable
        fontFamily: "var(--text-font-family), sans-serif", // 💡 INHERITED: Prestige body font
        overflowY: "auto",
        padding: "var(--section-vertical-spacing) var(--container-gutter)" // 💡 INHERITED: Prestige native section spacing tokens
      }}
    >
      {/* 📦 Main Catalog Grid Frame Container Box */}
      <div style={{ maxWidth: "var(--container-xl-max-width)", margin: "0 auto" }}>
        <header style={{ marginBottom: "40px", paddingLeft: "8px" }}>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.7, fontWeight: "500" }}>
            Showing <strong>{products.length}</strong> {products.length === 1 ? 'product' : 'products'}
          </div>
        </header>

        <main>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", 
              gap: "28px",
            }}
          >
            {products.map((prod) => {
              const assetImage = (prod as any).image || "https://placehold.co/400x400?text=No+Image";

              return (
                <div
                  key={prod.id}
                  onClick={() => handleCardClick(prod)}
                  style={{
                    backgroundColor: "rgb(var(--background-without-opacity))", // 💡 INHERITED: Native content canvas layer
                    borderRadius: "var(--input-border-radius)", // 💡 INHERITED: Global border radii configurations
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "var(--shadow-sm)", // 💡 INHERITED: Premium layout shadows
                    border: "1px solid var(--app-border)", // 💡 INHERITED: Prestige global structural border strokes
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.01)";
                    e.currentTarget.style.boxShadow = "var(--shadow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div style={{ aspectRatio: "1/1", backgroundColor: "rgba(var(--text-color) / 0.02)", overflow: "hidden", borderBottom: "1px solid var(--app-border)" }}>
                    <img
                      src={assetImage}
                      alt={prod.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "var(--text-letter-spacing)", color: "var(--app-text)", opacity: 0.6 }}>
                      {prod.productType || "MUGS & TUMBLERS"}
                    </div>
                    
                    <div style={{ fontSize: "var(--text-base)", fontWeight: "600", color: "var(--app-text)", margin: "2px 0" }}>
                      {prod.title}
                    </div>

                    <p style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.7, lineHeight: "1.5", margin: "0 0 12px 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {prod.description || "Create your bespoke corporate layouts interactively on this item inside our live studio customizer mesh suite."}
                    </p>

                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(var(--text-color) / 0.04)", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", padding: "8px 12px", marginTop: "auto", alignSelf: "flex-start" }}>
                      <LayersIcon style={{ width: "14px", height: "14px", color: "currentColor", opacity: 0.8 }} />
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--app-text)", opacity: 0.8, fontWeight: "500" }}>
                        Min Order: <strong style={{ color: "var(--app-text)", fontWeight: "600" }}>{prod.moq?.value || "20"} units</strong>
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
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--container-gutter)", boxSizing: "border-box", backdropFilter: "blur(8px)", backgroundColor: "rgba(0, 0, 0, 0.3)",
            opacity: isModalAnimating ? 1 : 0, visibility: isModalAnimating ? "visible" : "hidden", transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
          onClick={handleCloseModal}
        >
          <div 
            style={{
              position: "relative", backgroundColor: "rgb(var(--background-without-opacity))", border: "1px solid var(--app-border)", width: "100%", maxWidth: "1100px", maxHeight: "85vh", borderRadius: "var(--input-border-radius)", boxShadow: "var(--shadow-md)", overflow: "hidden", display: "flex", flexDirection: "row", alignItems: "stretch",
              transform: isModalAnimating ? "scale(1)" : "scale(0.97)", transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleCloseModal} style={{ position: "absolute", top: "16px", right: "16px", zIndex: 1100, backgroundColor: "rgb(var(--background-without-opacity))", border: "1px solid var(--app-border)", borderRadius: "50%", padding: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cross2Icon style={{ width: "16px", height: "16px", color: "currentColor" }} />
            </button>

            <div style={{ width: "55%", backgroundColor: "rgba(var(--text-color) / 0.02)", overflow: "hidden" }}>
              <img src={(selectedModalProduct as any).image || "https://placehold.co/600x600?text=No+Image"} alt={selectedModalProduct.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>

            <div style={{ width: "45%", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "space-between", backgroundColor: "rgb(var(--background-without-opacity))", overflowY: "auto" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "var(--text-letter-spacing)", color: "var(--app-text)", opacity: 0.6 }}>{selectedModalProduct.productType || "MUGS & TUMBLERS"}</span>
                  <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "700", color: "var(--app-text)", margin: "8px 0 0 0", letterSpacing: "-0.02em", lineHeight: "1.1" }}>{selectedModalProduct.title}</h2>
                </div>
                <div style={{ display: "inline-flex", alignSelf: "flex-start", backgroundColor: "rgba(var(--text-color) / 0.04)", border: "1px solid var(--app-border)", borderRadius: "var(--input-border-radius)", padding: "6px 12px" }}>
                  <span style={{ fontSize: "var(--text-xs)", fontWeight: "500", color: "var(--app-text)", opacity: 0.8 }}>₹ Rates tailored to your design</span>
                </div>
                <p style={{ fontSize: "var(--text-base)", color: "var(--app-text)", opacity: 0.9, lineHeight: "1.6", margin: 0 }}>{selectedModalProduct.description || "Crafted from fine-grained stoneware with a soft, matte cream glaze."}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "24px", borderTop: "1px solid var(--app-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)" }}>Volume/Size</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.8 }}>{(selectedModalProduct as any).volumeSize?.value || "3oz / 90ml"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)" }}>Material</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.8 }}>{(selectedModalProduct as any).material?.value || "Stoneware Clay"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)" }}>Minimum Order</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", fontWeight: "600" }}>{selectedModalProduct.moq?.value || "20"} units</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "48px" }}>
                <button 
                  onClick={() => { handleCloseModal(); onSelectProduct(selectedModalProduct); }}
                  className="btn-primary"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
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
            zIndex: 1200, 
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--container-gutter)",
            boxSizing: "border-box",
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            opacity: isWelcomeAnimating ? 1 : 0,
            visibility: isWelcomeAnimating ? "visible" : "hidden",
            transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        >
          <div 
            style={{
              backgroundColor: "rgb(var(--background-without-opacity))",
              border: "1px solid var(--app-border)",
              width: "100%",
              maxWidth: "480px",
              borderRadius: "var(--input-border-radius)",
              padding: "32px",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              transform: isWelcomeAnimating ? "scale(1)" : "scale(0.97)",
              transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "6px" }}>
              <h2 style={{ fontSize: "var(--text-xl)", fontWeight: "600", color: "var(--app-text)", margin: 0, letterSpacing: "-0.01em" }}>
                Welcome to Design Lab
              </h2>
              <p style={{ fontSize: "var(--text-base)", color: "var(--app-text)", opacity: 0.7, margin: 0 }}>
                Your creative journey starts here.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "8px 0" }}>
              
              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "rgba(var(--text-color) / 0.04)", border: "1px solid var(--app-border)", padding: "11px", borderRadius: "var(--input-border-radius)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <GridIcon style={{ width: "20px", height: "20px", color: "currentColor" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)", margin: "0 0 2px 0" }}>Select Your Canvas</h4>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.7, margin: 0, lineHeight: "1.4" }}>Choose any product from our collection to begin.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "rgba(var(--text-color) / 0.04)", border: "1px solid var(--app-border)", padding: "11px", borderRadius: "var(--input-border-radius)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BlendingModeIcon style={{ width: "20px", height: "20px", color: "currentColor" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)", margin: "0 0 2px 0" }}>Personalize Your Piece</h4>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.7, margin: 0, lineHeight: "1.4" }}>Experiment with different color options and upload your own unique designs.</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ backgroundColor: "rgba(var(--text-color) / 0.04)", border: "1px solid var(--app-border)", padding: "11px", borderRadius: "var(--input-border-radius)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BackpackIcon style={{ width: "20px", height: "20px", color: "currentColor" }} />
                </div>
                <div>
                  <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "600", color: "var(--app-text)", margin: "0 0 2px 0" }}>Bulk Ordering</h4>
                  <p style={{ fontSize: "var(--text-sm)", color: "var(--app-text)", opacity: 0.7, margin: 0, lineHeight: "1.4" }}>Finalize your design and place high-volume orders with ease.</p>
                </div>
              </div>

            </div>

            <button 
              onClick={handleCloseWelcome}
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Get Started
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
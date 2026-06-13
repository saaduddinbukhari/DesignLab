import { useState } from "react";
import type { B2BProduct } from "../types/customizer";

interface ProductGridProps {
  products: B2BProduct[];
  onSelectProduct: (product: B2BProduct) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  // Dynamic evaluation using fallback safely mapped targets
  const dynamicCategories = [
    "All",
    ...new Set(
      products.map((p) => p.productType || "General").filter(Boolean)
    ),
  ];

  const displayedProducts =
    activeCategory === "All"
      ? products
      : products.filter(
          (p) => (p.productType || "General") === activeCategory
        );

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🔮 Sidebar */}
      <div
        style={{
          width: "260px",
          backgroundColor: "#fff",
          borderRight: "1px solid #eef0f2",
          display: "flex",
          flexDirection: "column",
          padding: "24px 16px",
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: "32px", paddingLeft: "8px" }}>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
              margin: 0,
              color: "#181c1f"
            }}
          >
            Strange Lab Studio
          </h1>
          {/* 💡 Customer Copy Upgrade: Dropped technical jargon */}
          <p style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "4px" }}>
            Select a product to begin customizing
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: activeCategory === cat ? "#111" : "transparent",
                color: activeCategory === cat ? "#fff" : "#555",
                fontSize: "14px",
                fontWeight: activeCategory === cat ? "600" : "500",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {cat === "All" ? "All Products" : cat}
            </button>
          ))}
        </nav>
      </div>

      {/* 🛒 Main Workspace Grid Panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f6fafe" }}>
        <header
          style={{
            height: "64px",
            backgroundColor: "#fff",
            borderBottom: "1px solid #eef0f2",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
          }}
        >
          {/* 💡 Customer Copy Upgrade: assets -> products */}
          <div style={{ fontSize: "14px", color: "#3e4944" }}>
            Showing <strong>{displayedProducts.length}</strong> {displayedProducts.length === 1 ? 'product' : 'products'}
          </div>
        </header>

        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {displayedProducts.map((prod) => {
              const assetImage = (prod as any).image || "";
              const isHovered = hoveredCardId === prod.id;

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  onMouseEnter={() => setHoveredCardId(prod.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "16px",
                    border: isHovered ? "1px solid #bdc9c2" : "1px solid #eef0f2",
                    overflow: "hidden",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    // 💡 Subtle premium transform lift & shadow expand
                    transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                    boxShadow: isHovered ? "0 10px 25px rgba(215, 218, 223, 0.5)" : "0 0 0 transparent",
                    transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)",
                  }}
                >
                  {/* Image Wrap Viewports */}
                  <div
                    style={{
                      height: "180px",
                      backgroundColor: "#f7f7f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                      borderBottom: "1px solid #f1f4f8"
                    }}
                  >
                    {assetImage ? (
                      <img
                        src={assetImage}
                        alt={prod.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          // 💡 Image element zoom swell combo
                          transform: isHovered ? "scale(1.04)" : "scale(1)",
                          transition: "transform 0.5s ease-out",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "36px" }}>📦</span>
                    )}
                  </div>

                  {/* Info Metadata Block */}
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: "#6e7a73",
                      }}
                    >
                      {prod.productType || "General"}
                    </div>
                    
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#181c1f",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {prod.title}
                    </div>

                    {/* 💡 Dynamic Product Description Injection */}
                    <p
                      style={{
                        fontSize: "12px",
                        color: "#3e4944",
                        opacity: 0.85,
                        margin: "4px 0 0 0",
                        lineHeight: "1.5",
                        display: "-webkit-box",
                        WebkitLineClamp: 2, // Line-clamp to keep card layout symmetrical
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {prod.description || "Create your bespoke corporate layouts interactively on this item inside our live 3D customize suite."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
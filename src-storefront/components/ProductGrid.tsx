import { useState } from "react";
import type { B2BProduct } from "../types/customizer";

interface ProductGridProps {
  products: B2BProduct[];
  onSelectProduct: (product: B2BProduct) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState("All");

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
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Sidebar */}
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
            }}
          >
            Strange Lab Studio
          </h1>
          <p style={{ fontSize: "12px", color: "#8c8c8c", marginTop: "4px" }}>
            Select a base 3D container asset
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
                backgroundColor:
                  activeCategory === cat ? "#111" : "transparent",
                color: activeCategory === cat ? "#fff" : "#555",
                fontSize: "14px",
                fontWeight: activeCategory === cat ? "600" : "500",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
          <div style={{ fontSize: "14px", color: "#666" }}>
            Showing <strong>{displayedProducts.length}</strong> assets
          </div>
        </header>

        <main style={{ flex: 1, padding: "32px", overflowY: "auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "24px",
            }}
          >
            {displayedProducts.map((prod) => {
              // 💡 ALIGNMENT FIX: Fallback sequence tracking the image property
              // passed down from your main entry endpoint map
              const assetImage = (prod as any).image || "";

              return (
                <div
                  key={prod.id}
                  onClick={() => onSelectProduct(prod)}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #eef0f2",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                >
                  <div
                    style={{
                      height: "180px",
                      backgroundColor: "#f7f7f7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
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
                        }}
                      />
                    ) : (
                      "📦"
                    )}
                  </div>
                  <div style={{ padding: "14px" }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        color: "#111",
                      }}
                    >
                      {prod.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#8c8c8c",
                        marginTop: "4px",
                      }}
                    >
                      {prod.productType || "General"}
                    </div>
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
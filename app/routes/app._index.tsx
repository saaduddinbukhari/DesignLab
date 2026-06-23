import { useState, Suspense } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// 💡 3D WebGL Canvas Imports
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "../../src-storefront/components/ModelViewport";

// 💡 NATIVE BACKEND LOADER: Queries incoming records using standard attributes and catalog relationships
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    const response = await admin.graphql(
      `#graphql
      query getDesignEnquiries {
        draftOrders(first: 50, query: "tag:DesignLab-Enquiry", reverse: true) {
          nodes {
            id
            name
            createdAt
            note2
            lineItems(first: 5) {
              nodes {
                title
                quantity
                customAttributes {
                  key
                  value
                }
                product {
                  id
                  handle
                  media(first: 10) {
                    nodes {
                      mediaContentType
                      ... on Model3d {
                        sources {
                          url
                          format
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`
    );

    const responseJson = await response.json();
    const draftOrders = responseJson.data?.draftOrders?.nodes || [];

    const enquiries = draftOrders.map((order: any) => {
      const lines: string[] = order.note2?.split("\n") || [];
      const nameLine = lines.find(l => l.startsWith("Full Name:"));
      const emailLine = lines.find(l => l.startsWith("Customer Email:"));
      const phoneLine = lines.find(l => l.startsWith("Phone Number:"));
      const addressLine = lines.find(l => l.startsWith("Delivery / Business Address:"));
      
      const lineItemNode = order.lineItems?.nodes?.[0];
      const titleLine = lineItemNode?.title || "Custom Asset";

      // Read design data directly from structured custom line properties
      const attributes = lineItemNode?.customAttributes || [];
      
      const colorAttr = attributes.find((a: any) => a.key === "Selected Base Color");
      const packageColor = colorAttr ? colorAttr.value : "#F4F2EE";

      const mapAttr = attributes.find((a: any) => a.key === "Production Map URL");
      const extractedUrl = mapAttr ? mapAttr.value : null;

      // Resolves original .glb media nodes natively because the product link is intact
      const productMedia = lineItemNode?.product?.media?.nodes || [];
      const model3DNode = productMedia.find((m: any) => m.mediaContentType === "MODEL_3D");
      const realGlbUrl = model3DNode?.sources?.find((s: any) => s.format === "glb")?.url || null;

      return {
        id: order.id,
        orderName: order.name,
        date: new Date(order.createdAt).toLocaleDateString(),
        customerName: nameLine ? nameLine.replace("Full Name:", "").trim() : "N/A",
        email: emailLine ? emailLine.replace("Customer Email:", "").trim() : "N/A",
        phone: phoneLine ? phoneLine.replace("Phone Number:", "").trim() : "N/A",
        address: addressLine ? addressLine.replace("Delivery / Business Address:", "").trim() : "N/A",
        productTitle: titleLine,
        quantity: lineItemNode?.quantity || 0,
        textureUrl: extractedUrl,
        packageColor: packageColor,
        modelUrl: realGlbUrl,
        rawNote: order.note2 || "No notes attached."
      };
    });

    return { enquiries };
  } catch (error) {
    console.error("Dashboard inquiry load issue:", error);
    return { enquiries: [] };
  }
};

export default function Index() {
  const { enquiries } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<string | null>(enquiries.length > 0 ? enquiries[0].id : null);

  const activeEnquiry = enquiries.find(e => e.id === selectedId);
  const basicBackupModel = "https://raw.githubusercontent.com/KhronosGroup/GLTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb";

  return (
    <s-page heading="DesignLab Manufacturing Queue" subtitle="Review incoming production maps and client project details">
      {enquiries.length === 0 ? (
        <s-section heading="No active custom requests">
          <s-paragraph>When a customer completes a configuration on your storefront, their custom blueprints will automatically populate here.</s-paragraph>
        </s-section>
      ) : (
        // 💡 FIX: Restrict the main row layout to a clean max-width bounds to prevent viewport pushing
        <div style={{ display: "flex", gap: "24px", minHeight: "75vh", width: "100%", maxWidth: "1280px", boxSizing: "border-box" }}>
          
          {/* LEFT SIDE PANEL LIST VIEWPORT */}
          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0 }}>
            <s-text font-weight="bold" variant="heading-sm">SUBMISSIONS</s-text>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", maxHeight: "70vh" }}>
              {enquiries.map((item) => {
                const isSelected = item.id === selectedId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      padding: "16px", borderRadius: "12px",
                      border: isSelected ? "2px solid #17191b" : "1px solid #e1e3e5",
                      backgroundColor: isSelected ? "#fdf9f3" : "#ffffff", cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#17191b" }}>{item.orderName}</span>
                      <span style={{ fontSize: "12px", color: "#75777a" }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#44474a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.productTitle}</div>
                    <div style={{ fontSize: "12px", color: "#75777a", marginTop: "2px" }}>{item.customerName}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE DETAIL WORKBENCH INSPECTION SPACE */}
          {/* 💡 FIX: Added minWidth: 0 to force Flexbox to calculate its true parent width rather than trusting sizing measurements */}
          <div style={{ flex: 1, minWidth: 0, backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e1e3e5", padding: "32px", boxSizing: "border-box" }}>
            {activeEnquiry ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#17191b" }}>Spec Sheet ({activeEnquiry.orderName})</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#75777a" }}>Logged inside dashboard profile on {activeEnquiry.date}</p>
                  </div>
                  {activeEnquiry.textureUrl ? (
                    <s-button variant="primary" onClick={() => window.open(activeEnquiry.textureUrl!, "_blank")}>
                      Download Print-Ready 4K Map 📥
                    </s-button>
                  ) : (
                    <s-button disabled>No Asset URL Bound</s-button>
                  )}
                </div>

                <hr style={{ border: 0, borderTop: "1px solid #e1e3e5", margin: 0 }} />

                <div style={{ display: "flex", gap: "32px", width: "100%" }}>
                  <div style={{ width: "240px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Contact Name</span>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#17191b", marginTop: "2px" }}>{activeEnquiry.customerName}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Work Email</span>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#17191b", marginTop: "2px" }}>{activeEnquiry.email}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Phone Number</span>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#17191b", marginTop: "2px" }}>{activeEnquiry.phone}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Shipping Destination</span>
                      <div style={{ fontSize: "14px", fontWeight: "500", color: "#17191b", marginTop: "2px" }}>{activeEnquiry.address}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Selected Base Color</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                        <div style={{ width: "20px", height: "20px", borderRadius: "4px", border: "1px solid rgba(0,0,0,0.1)", backgroundColor: activeEnquiry.packageColor }} />
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#17191b" }}>{activeEnquiry.packageColor}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive 3D Review Canvas */}
                  {/* 💡 FIX: Added minWidth: 0 here as well to cleanly terminate horizontal canvas trailing inflation errors */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Interactive 3D Preview Review</span>
                    <div style={{ width: "100%", height: "280px", backgroundColor: "#f7f3ed", borderRadius: "12px", overflow: "hidden", border: "1px solid #e1e3e5", position: "relative" }}>
                      <Suspense fallback={<div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#75777a" }}>Loading 3D mesh engine...</div>}>
                        <Canvas camera={{ position: [0, 1.2, 3.2], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
                          <ambientLight intensity={0.5} />
                          <pointLight position={[10, 10, 10]} intensity={0.6} />
                          <Stage environment="warehouse" intensity={0.2} adjustCamera={false}>
                            <ModelViewport 
                              modelUrl={activeEnquiry.modelUrl || basicBackupModel}
                              packageColor={activeEnquiry.packageColor}
                              adminTextureUrl={activeEnquiry.textureUrl || undefined}
                            />
                          </Stage>
                          <OrbitControls enableZoom minDistance={0.1} maxDistance={0.5} />
                        </Canvas>
                      </Suspense>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Raw Customizer Note Logs</span>
                  <pre style={{ margin: 0, padding: "16px", backgroundColor: "#fdf9f3", borderRadius: "8px", fontSize: "12px", whiteSpace: "pre-wrap", color: "#44474a", border: "1px solid #e6e2dc", lineHeight: "1.6" }}>{activeEnquiry.rawNote}</pre>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#75777a" }}>Select an entry from the sidebar tracker panel.</div>
            )}
          </div>

        </div>
      )}
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);
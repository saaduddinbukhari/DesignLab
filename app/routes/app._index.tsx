import { useState, useEffect, Suspense } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
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
            note2 # 💡 FIXED: Changed from note to note2 to match Shopify's GraphQL Schema!
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
      const lines: string[] = order.note2?.split("\n") || []; // 💡 FIXED: note2
      const nameLine = lines.find(l => l.startsWith("Full Name:"));
      const emailLine = lines.find(l => l.startsWith("Customer Email:"));
      const phoneLine = lines.find(l => l.startsWith("Phone Number:"));
      const addressLine = lines.find(l => l.startsWith("Delivery / Business Address:"));
      
      const lineItemNode = order.lineItems?.nodes?.[0];
      const titleLine = lineItemNode?.title || "Custom Asset";

      // STANDARD APPROACH: Read design data directly from structured custom line properties!
      const attributes = lineItemNode?.customAttributes || [];
      
      const colorAttr = attributes.find((a: any) => a.key === "Selected Base Color");
      const packageColor = colorAttr ? colorAttr.value : "#F4F2EE";

      const mapAttr = attributes.find((a: any) => a.key === "Production Map URL");
      const extractedUrl = mapAttr ? mapAttr.value : null;

      // NATIVE HOOK: Resolves original .glb media nodes natively because the product link is intact!
      const productMedia = lineItemNode?.product?.media?.nodes || [];
      const model3DNode = productMedia.find((m: any) => m.mediaContentType === "MODEL_3D");
      const realGlbUrl = model3DNode?.sources?.find((s: any) => s.format === "glb")?.url || null;
      
      const isTemporary = extractedUrl && extractedUrl.includes("tmpfiles.org");

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
        rawNote: order.note2 || "No notes attached.", // 💡 FIXED: note2
        hasPendingSnapshot: isTemporary
      };
    });

    return { enquiries };
  } catch (error) {
    console.error("Dashboard inquiry load issue:", error);
    return { enquiries: [] };
  }
};

// 💡 BACKEND MIGRATION ACTION: Transfers temporary layouts to lifetime CDN static paths securely
export const action = async ({ ActionFunctionArgs, request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const draftOrderId = formData.get("draftOrderId") as string;
  const tempImageUrl = formData.get("tempImageUrl") as string;

  try {
    if (!tempImageUrl || !draftOrderId) return { success: true };

    const fileName = `designlab-${Date.now()}-production-sheet.png`;

    // STAGE 1: Handshake file allocation markers
    const stagedResponse = await admin.graphql(
      `#graphql
      mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
        }
      }`,
      { variables: { input: [{ filename: fileName, mimeType: "image/png", resource: "FILE" }] } }
    );
    const stagedRes = await stagedResponse.json();
    const target = stagedRes.data?.stagedUploadsCreate?.stagedTargets?.[0];

    if (!target) throw new Error("Shopify generic file staging parameter handshake failed.");

    // STAGE 2: Fetch array buffer bytes down into type-enforced memory segments
    const fileResponse = await fetch(tempImageUrl);
    if (!fileResponse.ok) throw new Error(`Stale file download reference status: ${fileResponse.status}`);
    
    const arrayBuffer = await fileResponse.arrayBuffer();
    const enforcedPngBlob = new Blob([arrayBuffer], { type: "image/png" });

    const multipartForm = new FormData();
    target.parameters.forEach(({ name, value }: any) => multipartForm.append(name, value));
    multipartForm.append("file", enforcedPngBlob, fileName);
    
    const uploadRes = await fetch(target.url, { method: "POST", body: multipartForm });
    if (!uploadRes.ok) throw new Error("Staging area bucket storage transmission failure.");

    // STAGE 3: Register asset permanently into merchant account media bank
    const commitResponse = await admin.graphql(
      `#graphql
      mutation fileCreate($files: [FileCreateInput!]!) {
        fileCreate(files: $files) { files { ... on GenericFile { url } } }
      }`,
      { variables: { files: [{ alt: `DesignLab Production Map`, contentType: "FILE", originalSource: target.resourceUrl }] } }
    );
    const commitRes = await commitResponse.json();
    const shopifyCDNUrl = commitRes.data?.fileCreate?.files?.[0]?.url || "";

    if (!shopifyCDNUrl) throw new Error("Failed to resolve permanent lifetime Shopify CDN target link.");

    // STAGE 4: Cleanly update tracking text note targets
    const orderLookup = await admin.graphql(
      `#graphql
      query lookupOrderNote($id: ID!) { draftOrder(id: $id) { note2 } }` , // 💡 FIXED: note2
      { variables: { id: draftOrderId } }
    );
    const lookupRes = await orderLookup.json();
    const currentNote = lookupRes.data?.draftOrder?.note2 || ""; // 💡 FIXED: note2

    const updatedNote = currentNote.replace(tempImageUrl, shopifyCDNUrl);

    await admin.graphql(
      `#graphql
      mutation rewriteNoteDetails($id: ID!, $note: String!) {
        draftOrderUpdate(id: $id, input: { note: $note }) { draftOrder { id } }
      }`,
      { variables: { id: draftOrderId, note: updatedNote } }
    );

    return { success: true };
  } catch (err: any) {
    console.error("Admin file hydration error:", err);
    return { error: err.message || "Failed background asset migration pass." };
  }
};

export default function Index() {
  const { enquiries } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [selectedId, setSelectedId] = useState<string | null>(enquiries.length > 0 ? enquiries[0].id : null);
  
  // ERROR GUARD RAIL: Blocks problematic or expired snapshots from infinite looping retries
  const [failedSyncs, setFailedSyncs] = useState<string[]>([]);

  const activeEnquiry = enquiries.find(e => e.id === selectedId);

  useEffect(() => {
    const pendingItem = enquiries.find(e => e.hasPendingSnapshot && !failedSyncs.includes(e.id));
    if (pendingItem && fetcher.state === "idle") {
      if (fetcher.data && (fetcher.data as any).error) {
        setFailedSyncs(prev => [...prev, pendingItem.id]);
        return;
      }
      fetcher.submit(
        { draftOrderId: pendingItem.id, tempImageUrl: pendingItem.textureUrl || "" },
        { method: "POST" }
      );
    }
  }, [enquiries, fetcher, failedSyncs]);

  const basicBackupModel = "https://raw.githubusercontent.com/KhronosGroup/GLTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb";

  return (
    <s-page heading="DesignLab Manufacturing Queue" subtitle="Review incoming production maps and client project details">
      {enquiries.length === 0 ? (
        <s-section heading="No active custom requests">
          <s-paragraph>When a customer completes a configuration on your storefront, their custom blueprints will automatically populate here.</s-paragraph>
        </s-section>
      ) : (
        <div style={{ display: "flex", gap: "24px", minHeight: "75vh" }}>
          
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
                    {item.hasPendingSnapshot && !failedSyncs.includes(item.id) && (
                      <div style={{ marginTop: "6px", fontSize: "11px", color: "#b25e00", fontWeight: "600" }}>🔄 Archiving Map to Shopify Files...</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE DETAIL WORKBENCH INSPECTION SPACE */}
          <div style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: "16px", border: "1px solid #e1e3e5", padding: "32px", boxSizing: "border-box" }}>
            {activeEnquiry ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

                <div style={{ display: "flex", gap: "32px" }}>
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
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
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
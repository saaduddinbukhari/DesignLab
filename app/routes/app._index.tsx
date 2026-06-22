import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

// 💡 BACKEND LOADER: Instantly queries your active custom design inquiries
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  try {
    // Robust multi-parameter fallback filter scanning for either tag or product title prefix
    const response = await admin.graphql(
      `#graphql
      query getDesignEnquiries {
        draftOrders(first: 50, query: "tag:DesignLab-Enquiry OR title:B2B Custom*", reverse: true) {
          nodes {
            id
            name
            createdAt
            note2
            lineItems(first: 5) {
              nodes {
                title
                quantity
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
      const emailLine = lines.find(l => l.startsWith("Customer Email:"));
      const phoneLine = lines.find(l => l.startsWith("Phone Number:"));
      const addressLine = lines.find(l => l.startsWith("Delivery / Business Address:"));
      
      // 💡 Robust scan finding any row that houses the active HTTP delivery address link
      const cdnLine = lines.find(l => l.includes("http"));
      let extractedUrl = null;
      if (cdnLine) {
        const match = cdnLine.match(/https?:\/\/[^\s]+/);
        if (match) extractedUrl = match[0];
      }

      return {
        id: order.id,
        orderName: order.name,
        date: new Date(order.createdAt).toLocaleDateString(),
        email: emailLine ? emailLine.replace("Customer Email:", "").trim() : "N/A",
        phone: phoneLine ? phoneLine.replace("Phone Number:", "").trim() : "N/A",
        address: addressLine ? addressLine.replace("Delivery / Business Address:", "").trim() : "N/A",
        productTitle: order.lineItems.nodes[0]?.title || "Custom Asset",
        quantity: order.lineItems.nodes[0]?.quantity || 0,
        textureUrl: extractedUrl,
        rawNote: order.note2 || "No notes attached."
      };
    });

    return { enquiries };
  } catch (error) {
    console.error("Dashboard inquiry load issue:", error);
    return { enquiries: [] };
  }
};

// 💡 BACKEND ACTION: Kept as a clean fallback shell since foreground uploading is active!
export const action = async ({ request }: ActionFunctionArgs) => {
  return { success: true };
};

export default function Index() {
  const { enquiries } = useLoaderData<typeof loader>();
  const [selectedId, setSelectedId] = useState<string | null>(enquiries.length > 0 ? enquiries[0].id : null);

  const activeEnquiry = enquiries.find(e => e.id === selectedId);

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
                    <div style={{ display: "flex", justifycontent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "700", fontSize: "14px", color: "#17191b" }}>{item.orderName}</span>
                      <span style={{ fontSize: "12px", color: "#75777a" }}>{item.date}</span>
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: "500", color: "#44474a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.productTitle}</div>
                    <div style={{ fontSize: "12px", color: "#75777a", marginTop: "2px" }}>{item.email}</div>
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
                  </div>

                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#75777a", textTransform: "uppercase" }}>Raw Customizer Note Logs</span>
                    <pre style={{ margin: 0, padding: "16px", backgroundColor: "#fdf9f3", borderRadius: "8px", fontSize: "12px", whiteSpace: "pre-wrap", color: "#44474a", border: "1px solid #e6e2dc", lineHeight: "1.6" }}>{activeEnquiry.rawNote}</pre>
                  </div>
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
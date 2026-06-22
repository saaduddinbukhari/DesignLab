import { authenticate } from "../shopify.server";

// 💡 LOADER: Securely queries your inventory along with the dynamic spec sheet fields
export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    if (!admin) {
      return new Response(JSON.stringify({ error: "Unauthorized request origin." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query Shopify Admin GraphQL API
    const response = await admin.graphql(`
      #graphql
      query getCustomizableProducts {
        products(first: 50) {
          edges {
            node {
              id
              title
              description
              handle
              productType
              featuredImage {
                url
              }
              
              # 1. Fetch the B2B activation filter flag metafield
              isB2B: metafield(namespace: "custom", key: "b2b_env_product") {
                value
              }
              
              # 2. Fetch the canvas dimensions configuration blueprint
              dieline: metafield(namespace: "custom", key: "dieline_config") {
                value
              }
              
              # 3. Fetch the actual Minimum Order Quantity integer value!
              moqConfig: metafield(namespace: "custom", key: "minimum_order_quantity") {
                value
              }

              # 💡 INJECTED: Fetch your spec sheet parameters natively from product settings
              volumeConfig: metafield(namespace: "custom", key: "designlab_volume_size") {
                value
              }
              materialConfig: metafield(namespace: "custom", key: "designlab_material") {
                value
              }
              
              # 4. Scan product media directly for native 3D files
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

              # Retained fallback metafield slot
              glbFile: metafield(namespace: "custom", key: "glb_model") {
                reference {
                  ... on GenericFile {
                    url
                  }
                }
              }
            }
          }
        }
      }
    `);

    const responseJson = await response.json();
    const allProducts = responseJson.data?.products?.edges || [];

    // Map out and transform data cleanly for your React frontend
    const customizableProducts = allProducts
      .map(edge => {
        const node = edge.node;

        return {
          id: node.id,
          title: node.title,
          description: node.description,
          handle: node.handle,
          productType: node.productType || "General",
          image: node.featuredImage?.url || "https://placehold.co/300x300?text=No+Image", //
          
          isB2B: node.isB2B, 
          dielineConfig: node.dieline,
          moq: node.moqConfig || { value: "20" }, //

          // Binds fields directly onto runtime grid objects
          volumeSize: node.volumeConfig || { value: "3oz / 90ml" }, //
          material: node.materialConfig || { value: "Stoneware Clay" }, //
          
          media: node.media || { nodes: [] } //
        };
      })
      .filter(product => product.isB2B?.value === "true"); //

    return new Response(JSON.stringify({ products: customizableProducts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ App Proxy Critical Loader Error:", error); //
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), { //
      status: 500, //
      headers: { "Content-Type": "application/json" }, //
    });
  }
};

// 💡 NEW: COMPLIANT ACTION HANDLER FOR PROCESSING FRONTEND ENQUIRY DATA PACKETS
export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    
    if (!session || !admin) {
      return new Response(JSON.stringify({ error: "Unauthorized session channel request context origin." }), { //
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await request.json();

    if (payload.action === "SUBMIT_ENQUIRY") {
      const publicCdnUrl = payload.designSnapshot; //
      
      if (!publicCdnUrl) {
        return new Response(JSON.stringify({ error: "Missing compiled layout URL link." }), { //
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generate the Draft Order record instantly
      const draftOrderResponse = await admin.graphql(
        `#graphql
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
            }
          }
        }`,
        {
          variables: {
            input: {
              // 💡 FIXED NOTE: Drops the live, instantly active 4K blueprint URL straight into the merchant note
              note: `DesignLab B2B Customization Specs\n\nFull Name: ${payload.name}\nCustomer Email: ${payload.email}\nPhone Number: ${payload.phone}\nDelivery / Business Address: ${payload.address}\nProduction Notes: ${payload.notes}\n\n📥 DOWNLOAD 4K PRINT READY PRODUCTION MAP:\n${publicCdnUrl}`,
              tags: ["DesignLab-Enquiry"], // Matches your admin dashboard query tag
              lineItems: [{
                title: `B2B Custom: ${payload.productTitle} (Base Color: ${payload.packageColor})`, //
                quantity: parseInt(payload.quantity || "20"), //
                originalUnitPrice: "0.00" // Compliant field value
              }]
            }
          }
        }
      );

      const draftOrderData = await draftOrderResponse.json();
      if (draftOrderData.errors) throw new Error(JSON.stringify(draftOrderData.errors)); //

      return new Response(JSON.stringify({ success: true }), { //
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unsupported operation request transmission channel method type." }), { //
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ Critical App Proxy Action Submission Exception:", error); //
    return new Response(JSON.stringify({ error: "Failed to compile custom design submission form fields data.", details: error.message }), { //
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
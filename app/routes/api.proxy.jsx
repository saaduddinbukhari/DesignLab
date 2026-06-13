import { authenticate } from "../shopify.server";

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
              
              # 2. Fetch the canvas canvas dimensions configuration blueprint
              dieline: metafield(namespace: "custom", key: "dieline_config") {
                value
              }
              
              # 💡 FIX: Fetch the actual Minimum Order Quantity integer value!
              moqConfig: metafield(namespace: "custom", key: "minimum_order_quantity") {
                value
              }
              
              # 3. Scan product media directly for native 3D files
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
          image: node.featuredImage?.url || "https://placehold.co/300x300?text=No+Image",
          
          // Preserve the raw metafield wrappers
          isB2B: node.isB2B, 
          dielineConfig: node.dieline,
          
          // 💡 FIXED MOQ MAPPING: Pulls the parsed integer string or defaults cleanly to 1
          moq: node.moqConfig || { value: "1" },
          
          // Preserve the raw media nodes structure
          media: node.media || { nodes: [] }
        };
      })
      // Keep your filter active so only approved assets populate the grid
      .filter(product => product.isB2B?.value === "true");

    return new Response(JSON.stringify({ products: customizableProducts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("❌ App Proxy Critical Loader Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
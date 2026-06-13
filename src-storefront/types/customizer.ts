export interface ShopifyMetafield {
  value: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: string;
}

export interface ProductMediaNode {
  mediaContentType: string;
  sources: { url: string; format: string }[];
}

export interface DielineConfig {
  printX: number;
  printY: number;
  printW: number;
  printH: number;
}

export interface B2BProduct {
  id: string;
  title: string;
  handle: string;
  productType: string;
  b2bEnvProduct?: ShopifyMetafield;
  moq?: ShopifyMetafield;
  dielineConfig?: ShopifyMetafield;
  variants: { nodes: ProductVariant[] };
  media: { nodes: ProductMediaNode[] };
}

export interface ArtworkObject {
  id: string;
  image: HTMLImageElement;
  dataUrl: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface LoaderData {
  products: B2BProduct[];
}

export const DEFAULT_DIELINE: DielineConfig = {
  printX: 0,
  printY: 0,
  printW: 1024,
  printH: 1024,
};

export function parseDieline(metafield?: ShopifyMetafield): DielineConfig {
  if (!metafield?.value) return DEFAULT_DIELINE;
  try {
    const parsed = JSON.parse(metafield.value);
    if (
      typeof parsed.printX === "number" &&
      typeof parsed.printY === "number" &&
      typeof parsed.printW === "number" &&
      typeof parsed.printH === "number"
    ) {
      return parsed as DielineConfig;
    }
    return DEFAULT_DIELINE;
  } catch {
    return DEFAULT_DIELINE;
  }
}

export function getActiveModelUrl(product: B2BProduct | null): string | null {
  if (!product?.media?.nodes) return null;
  const modelNode = product.media.nodes.find(
    (n) => n.mediaContentType === "MODEL_3D"
  );
  return modelNode?.sources?.find((s) => s.format === "glb")?.url ?? null;
}

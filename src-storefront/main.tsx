import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// 💡 Import your clean, newly migrated modular components
import { LoadingScreen } from './components/LoadingScreen';
import { ProductGrid } from './components/ProductGrid';
import { OverviewPanel } from './components/OverviewPanel';
import { DesignMode } from './components/DesignMode';

// 💡 Import your state orchestrator hook and helper utilities
import { useArtworkEditor } from './hooks/useArtworkEditor';
import { parseDieline, getActiveModelUrl } from './types/customizer';
import type { B2BProduct } from './types/customizer';

// 💡 1. Universal CSS Font Face Reset & Custom Scrollbar Injector
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = `
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined' !important;
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      -webkit-font-smoothing: antialiased;
    }
    .hide-scrollbar::-webkit-scrollbar { display: none; }
    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(styleTag);
}

// 💡 2. Consolidated Stitch Design Theme Extensions
if ((window as any).tailwind) {
  (window as any).tailwind.config = {
    theme: {
      extend: {
        colors: {
          "surface-container": "#ebeef3",
          "outline": "#6e7a73",
          "on-primary": "#ffffff",
          "inverse-surface": "#2d3134",
          "surface-dim": "#d7dadf",
          "secondary": "#486800",
          "primary-container": "#008060",
          "tertiary": "#226254",
          "on-background": "#181c1f",
          "on-surface-variant": "#3e4944",
          "on-surface": "#181c1f",
          "surface-variant": "#dfe3e7",
          "surface-container-low": "#f1f4f8",
          "surface-container-lowest": "#ffffff",
          "primary": "#00654b",
          "background": "#f6fafe",
          "surface": "#f6fafe",
          "outline-variant": "#bdc9c2",
          "preview-primary": "#6b38d4",
          "preview-container": "#8455ef",
          "preview-bg": "#f8f9ff"
        },
        spacing: {
          "margin-page": "32px",
          "gutter": "20px"
        }
      }
    }
  };
}

// 💡 Define explicit Type Interfaces for the parsed Liquid Dataset
interface DesignLabAppProps {
  shopDomain: string;
  loadingAnimationUrl: string;
}

function DesignLabApp({ shopDomain, loadingAnimationUrl }: DesignLabAppProps) {
  const [currentView, setCurrentView] = useState<'grid' | 'overview' | 'design'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Material Swatch State variable tracking hex updates
  const [packageColor, setPackageColor] = useState('#ffffff');

  // 💡 Instantiate your custom hooks framework engine safely
  const {
    artworks,
    selectedArtworkId,
    isDragging,
    textureCanvasRef,
    setSelectedArtworkId,
    handleTextureUpload,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleScaleChange,
    removeArtwork,
    clearArtworks,
    isOutOfBounds,
    getCurrentScale,
  } = useArtworkEditor();

  // Compute parsed dieline configurations safely out of dynamic metafield tags
  const currentDieline = parseDieline(selectedProduct?.dielineConfig);
  const activeModelUrl = getActiveModelUrl(selectedProduct);
  const currentScale = getCurrentScale(currentDieline);

  // Fetch product listings from the App Proxy routing layer on mount
  useEffect(() => {
    fetch('/apps/designlab/api/proxy')
      .then(res => res.json())
      .then(data => {
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        } else {
          setProducts([
            {
              id: '1',
              title: 'Custom-B2B-Mug',
              handle: 'custom-b2b-mug',
              productType: 'Mugs & Tumblers',
              variants: { nodes: [{ id: 'v1', sku: 'MUG-001', price: '12.50' }] },
              media: {
                nodes: [
                  {
                    mediaContentType: 'MODEL_3D',
                    sources: [{ url: '', format: 'glb' }]
                  }
                ]
              },
              moq: { value: '50' },
              dielineConfig: { value: JSON.stringify({ printX: 0, printY: 0, printW: 1024, printH: 256 }) }
            }
          ]);
        }
        setLoading(false)
      })
      .catch(err => {
        console.error("Proxy routing layer failure:", err);
        setLoading(false);
      });
  }, []);

  // 2. Optimized Lottie Loading Screen Loop Execution
  if (loading) {
    return (
      <div className="w-full h-screen bg-background">
        {/* 💡 Pass down the parsed safe Shopify CDN URL context */}
        <LoadingScreen 
          animationUrl={loadingAnimationUrl} 
          message="Loading customizer options..." 
        />
      </div>
    );
  }

  return (
    <main className="font-['Inter'] antialiased w-full h-screen bg-background text-on-background">
      {/* 💡 View 1: Main Collection Assets Selection Grid */}
      {currentView === 'grid' && (
        <ProductGrid 
          products={products}
          onSelectProduct={(product) => {
            setSelectedProduct(product);
            setCurrentView('overview');
          }}
        />
      )}

      {/* 💡 View 2: Pre-edit Overview Panel upload screening */}
      {currentView === 'overview' && selectedProduct && (
        <OverviewPanel 
          product={selectedProduct}
          dieline={currentDieline}
          modelUrl={activeModelUrl}
          onBack={() => setCurrentView('grid')}
          onUpload={(e) => {
            handleTextureUpload(e, currentDieline, packageColor);
            setCurrentView('design');
          }}
        />
      )}

      {/* 💡 View 3: Full Interlocking 2D Canvas Drag-and-Drop and 3D Studio Environment */}
      {currentView === 'design' && selectedProduct && (
        <DesignMode 
          product={selectedProduct}
          artworks={artworks}
          selectedArtworkId={selectedArtworkId}
          isDragging={isDragging}
          dieline={currentDieline}
          packageColor={packageColor}
          currentScale={currentScale}
          textureCanvas={textureCanvasRef.current} 
          modelUrl={activeModelUrl}
          
          onBack={() => {
            const canvas = textureCanvasRef.current;
            if (canvas && artworks.length > 0) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Resize the underlying sheet smoothly to full crisp 4K density
                canvas.width = 4096;
                canvas.height = 4096;
                ctx.clearRect(0, 0, 4096, 4096);
                
                const mult = 4096 / 1024;
                for (const art of artworks) {
                  ctx.drawImage(
                    art.image,
                    (currentDieline.printX + art.x) * mult,
                    (currentDieline.printY + art.y) * mult,
                    art.w * mult,
                    art.h * mult
                  );
                }
              }
            }
            setCurrentView('overview');
          }}
          
          onSelectArtwork={setSelectedArtworkId}
          onRemoveArtwork={(id) => removeArtwork(id, currentDieline, packageColor)}
          onAddArtwork={(e) => handleTextureUpload(e, currentDieline, packageColor)}
          onScaleChange={(scale) => handleScaleChange(scale, currentDieline, packageColor)}
          onColorChange={setPackageColor}
          onSave={() => alert("Saved!")}
          onMouseDown={(e) => handleMouseDown(e, currentDieline, 500)}
          onMouseMove={(e) => handleMouseMove(e, currentDieline, 500, packageColor)}
          onMouseUp={handleMouseUp}
          isOutOfBounds={(art) => isOutOfBounds(art, currentDieline)}
        />
      )}

      {/* Hidden offscreen canvas element serving the ThreeJS render pipeline */}
      <canvas ref={textureCanvasRef} style={{ display: 'none' }} />
    </main>
  );
}

const rootElement = document.getElementById('design-lab-root');
if (rootElement) {
  // 💡 Safely read dataset variables directly from the Liquid template markup mounting node
  const shopDomain = rootElement.getAttribute('data-shop-domain') || '';
  const loadingAnimationUrl = rootElement.getAttribute('data-loading-animation-url') || 'loading-animation.json';

  rootElement.innerHTML = ''; 
  ReactDOM.createRoot(rootElement).render(
    <DesignLabApp 
      shopDomain={shopDomain} 
      loadingAnimationUrl={loadingAnimationUrl} 
    />
  );
}
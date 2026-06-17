import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

// 💡 Import your clean, newly migrated modular components
import { LoadingScreen } from './components/LoadingScreen';
import { ProductGrid } from './components/ProductGrid';
import { OverviewPanel } from './components/OverviewPanel';
import { EnquiryScreen } from './components/EnquiryScreen'; // 💡 INJECTED: Connects your new Stitch review workspace

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

// 💡 2. Consolidated Stitch Design Theme Extensions matching designlabmain.html color specs
if ((window as any).tailwind) {
  (window as any).tailwind.config = {
    theme: {
      extend: {
        colors: {
          "surface-container-lowest": "#ffffff",
          "outline": "#75777a",
          "on-secondary-fixed": "#1b1c1a",
          "primary": "#17191b",
          "on-secondary": "#ffffff",
          "on-background": "#1c1c18",
          "surface-variant": "#e6e2dc",
          "surface-container-highest": "#e6e2dc",
          "secondary": "#5e5e5c",
          "on-tertiary": "#ffffff",
          "primary-fixed": "#e2e2e5",
          "outline-variant": "#c5c6ca",
          "surface-container-low": "#f7f3ed",
          "inverse-on-surface": "#f5f0ea",
          "on-surface": "#1c1c18",
          "on-tertiary-fixed-variant": "#484742",
          "on-tertiary-container": "#989590",
          "on-surface-variant": "#44474a",
          "surface-container-high": "#ece7e2",
          "inverse-primary": "#c6c6c9",
          "secondary-container": "#e1dfdc",
          "surface-container": "#f2ede7",
          "surface-tint": "#5d5e61",
          "on-primary-fixed-variant": "#454749",
          "tertiary-container": "#2f2e2a",
          "inverse-surface": "#32302d",
          "on-secondary-fixed-variant": "#474744",
          "on-error": "#ffffff",
          "on-primary-fixed": "#1a1c1e",
          "tertiary-fixed": "#e6e2dc",
          "error": "#ba1a1a",
          "primary-container": "#2c2e30",
          "on-primary-container": "#949598",
          "surface-bright": "#fdf9f3",
          "secondary-fixed": "#e4e2de",
          "primary-fixed-dim": "#c6c6c9",
          "on-secondary-container": "#636360",
          "tertiary": "#1a1916",
          "background": "#fdf9f3",
          "tertiary-fixed-dim": "#cac6c0",
          "surface": "#fdf9f3",
          "on-primary": "#ffffff",
          "surface-dim": "#ddd9d4",
          "secondary-fixed-dim": "#c8c6c3",
          "on-tertiary-fixed": "#1c1c18",
          "on-error-container": "#93000a",
          "error-container": "#ffdad6"
        },
        spacing: {
          "margin-page": "32px",
          "gutter": "20px"
        }
      }
    }
  };
}

interface DesignLabAppProps {
  shopDomain: string;
  loadingAnimationUrl: string;
}

function DesignLabApp({ shopDomain, loadingAnimationUrl }: DesignLabAppProps) {
  // 💡 INTERNAL ROUTER TABS: Smoothly shifts across gallery grid, 2D studio editor console, and custom checkout sheets
  const [currentView, setCurrentView] = useState<'grid' | 'overview' | 'enquiry'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<B2BProduct | null>(null);
  const [products, setProducts] = useState<B2BProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Material Swatch State variable tracking hex updates
  const [packageColor, setPackageColor] = useState('#F4F2EE');

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
          // Fallback mockup model structure safely structured
          setProducts([
            {
              id: '1',
              title: 'Ceramic Vessel',
              handle: 'ceramic-vessel',
              productType: 'Mugs & Tumblers',
              variants: { nodes: [{ id: 'v1', sku: 'MUG-001', price: '0.00' }] },
              media: { nodes: [{ mediaContentType: 'MODEL_3D', sources: [{ url: '', format: 'glb' }] }] },
              moq: { value: '20' },
              volumeSize: { value: '3oz / 90ml' }, // Essential baseline default fields
              material: { value: 'Stoneware Clay' },
              dielineConfig: { value: JSON.stringify({ printX: 0, printY: 0, printW: 1024, printH: 1024 }) }
            }
          ]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Proxy routing layer failure:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen bg-background">
        <LoadingScreen 
          animationUrl={loadingAnimationUrl} 
          message="Loading customizer options..." 
        />
      </div>
    );
  }

  return (
    <main className="antialiased w-full h-screen bg-[#fdf9f3] text-[#1c1c18]">
      
      {/* 💡 VIEW 1: OVERHAULED STITCH CATALOGUE SELECTION GRID */}
      {currentView === 'grid' && (
        <ProductGrid 
          products={products}
          onSelectProduct={(product) => {
            setSelectedProduct(product);
            setCurrentView('overview'); // Advances cleanly into consolidated workshop space
          }}
        />
      )}

      {/* 💡 VIEW 2: INTEGRATED CONSOLIDATED SPLIT STUDIO EDIT CONSOLE PANEL */}
      {currentView === 'overview' && selectedProduct && (
        <OverviewPanel 
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
            clearArtworks(); // Scrub scratchpad buffer memory layers on exit
            setCurrentView('grid');
          }}
          onSelectArtwork={setSelectedArtworkId}
          onRemoveArtwork={(id) => removeArtwork(id, currentDieline, packageColor)}
          onAddArtwork={(e) => handleTextureUpload(e, currentDieline, packageColor)}
          onScaleChange={(scale) => handleScaleChange(scale, currentDieline, packageColor)}
          onColorChange={setPackageColor}
          
          // 💡 SWITCH ACTION: Moving on forward to dynamic enquiry data sheet page
          onSave={() => setCurrentView('enquiry')}
          
          onMouseDown={(e) => handleMouseDown(e, currentDieline, 500)}
          onMouseMove={(e) => handleMouseMove(e, currentDieline, 500, packageColor)}
          onMouseUp={handleMouseUp}
          isOutOfBounds={(art) => isOutOfBounds(art, currentDieline)}
        />
      )}

      {/* 💡 VIEW 3: STITCH REPLICATED 4K FLATTENING INSPECTOR & CHECKOUT SHEET */}
      {currentView === 'enquiry' && selectedProduct && (
        <EnquiryScreen
          product={selectedProduct}
          packageColor={packageColor}
          textureCanvas={textureCanvasRef.current}
          modelUrl={activeModelUrl}
          onBack={() => setCurrentView('overview')} // Allows infinite return iterations for design tweaks
          onSubmitEnquiry={async (formData) => {
            try {
              // Push the inquiry data packet straight through the proxy tunnel endpoint
              const response = await fetch("/apps/designlab/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "SUBMIT_ENQUIRY",
                  productTitle: selectedProduct.title,
                  packageColor: packageColor,
                  quantity: selectedProduct.moq?.value || "20",
                  ...formData
                })
              });
              
              const result = await response.json();
              if (result.success) {
                alert("Enquiry Logged Successfully! Our manufacturing queue has received your design sheet.");
                clearArtworks();
                setCurrentView('grid'); // Return directly to central catalog view on completion
              } else {
                alert(`Submission issue: ${result.error}`);
              }
            } catch (err) {
              alert("Network entry pipeline transmission exception.");
            }
          }}
        />
      )}

      {/* Hidden offscreen canvas element serving the ThreeJS render pipeline */}
      <canvas ref={textureCanvasRef} style={{ display: 'none' }} />
    </main>
  );
}

const rootElement = document.getElementById('design-lab-root');
if (rootElement) {
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
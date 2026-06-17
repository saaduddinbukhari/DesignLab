import { Suspense, useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { ModelViewport } from "./ModelViewport"; // 💡 Connects straight to your real-time 3D engine hook
import { ArtworkCanvas } from "./ArtworkCanvas";   // 💡 Your high-performance 2D canvas workspace
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  TrashIcon, 
  UploadIcon,
  MixerHorizontalIcon 
} from "@radix-ui/react-icons";
import type { ArtworkObject, B2BProduct, DielineConfig } from "../types/customizer";
import { ColorPicker } from "./color-picker";

const DISPLAY_SIZE = 500;

interface OverviewPanelProps {
  product: B2BProduct;
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  dieline: DielineConfig;
  packageColor: string;
  currentScale: number;
  textureCanvas: HTMLCanvasElement | null;
  modelUrl: string | null;
  onBack: () => void;
  onSelectArtwork: (id: string) => void;
  onRemoveArtwork: (id: string) => void;
  onAddArtwork: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onScaleChange: (scale: number) => void;
  onColorChange: (color: string) => void;
  onSave: () => void; // 💡 Map this callback to transition directly to your final review & inquiry checkout page!
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  isOutOfBounds: (art: ArtworkObject) => boolean;
}

export function OverviewPanel({
  product,
  artworks,
  selectedArtworkId,
  isDragging,
  dieline,
  packageColor,
  currentScale,
  textureCanvas,
  modelUrl,
  onBack,
  onSelectArtwork,
  onRemoveArtwork,
  onAddArtwork,
  onScaleChange,
  onColorChange,
  onSave,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  isOutOfBounds,
}: OverviewPanelProps) {
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFinish, setActiveFinish] = useState<'matte' | 'gloss'>('matte');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

  // Stitch Custom Core Palette node arrays matching designscreenlayout.html
  const stitchPalette = [
    "#FFADAD", "#FFD6A5", "#FDFFB6", "#CAFFBF", "#9BF6FF", "#A0C4FF",
    "#BDB2FF", "#FFC6FF", "#FFFFFC", "#EDF2FB", "#D7E3FC", "#CCDBFD",
    "#C1D3FE", "#B6CCFE", "#ABC4FF", "#75777a", "#44474a", "#17191b"
  ];

  return (
    <div 
      className="min-h-screen flex flex-col w-full bg-[#fdf9f3]" 
      style={{ fontFamily: "'Manrope', sans-serif" }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      
      {/* 🧭 TopAppBar Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-3 max-w-[1280px] mx-auto h-16 box-border">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="hover:bg-gray-50 p-2 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-colors"
            >
              <ArrowLeftIcon style={{ width: "20px", height: "20px", color: "#17191b" }} />
            </button>
            <h1 className="text-xl font-bold text-[#17191b] m-0">Design Lab</h1>
          </div>
          <div>
            <button 
              onClick={onSave} // Moves onward to dynamic checkout sheet layout
              className="text-xs font-semibold bg-[#17191b] text-white px-5 py-2.5 rounded-lg border-none hover:opacity-90 cursor-pointer transition-all active:scale-98"
            >
              Preview and Submit Enquiry
            </button>
          </div>
        </div>
      </header>

      {/* 🎛️ Main Content Layout Canvas Grid */}
      <main className="flex-grow flex flex-col lg:flex-row max-w-[1280px] mx-auto w-full p-6 gap-6 box-border mb-10 overflow-hidden">
        
        {/* 🎨 LEFT COLUMN PANEL: High Performance 2D UV Space Mapping Workspace */}
        <section className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm min-h-[550px]">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-white">
            <h2 className="text-base font-bold text-[#17191b] m-0">Design Area</h2>
          </div>

          {/* Core Interactive Rendering Mesh Wrapper */}
          <div 
            className="flex-grow relative flex items-center justify-center p-6 bg-white" // 💡 FIXED: Checkers viewport background set to pure white
            style={{
              backgroundImage: "linear-gradient(to right, rgba(117,119,122,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(117,119,122,0.05) 1px, transparent 1px)", // 💡 FIXED: Clean grey gridlines matching designscreenlayout.html
              backgroundSize: "20px 20px"
            }}
          >
            {/* Instruction Overlay Background Layer */}
            {artworks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40 select-none z-0">
                <UploadIcon style={{ width: "36px", height: "36px", color: "#75777a", marginBottom: "8px" }} />
                <p className="text-sm font-medium text-[#5e5e5c] m-0">Load artwork below to customize</p>
              </div>
            )}

            {/* High Performance 2D Editor Hook Overlay */}
            <div 
              className="relative z-10" 
              onMouseDown={onMouseDown}
              style={{ 
                border: "1px solid #dfe3e7", // 💡 FIXED: Changed bounding container border from blue to clean grey
                borderRadius: "8px",
                overflow: "hidden"
              }}
            >
              <ArtworkCanvas
                artworks={artworks}
                selectedArtworkId={selectedArtworkId}
                isDragging={isDragging}
                dieline={dieline}
                displaySize={DISPLAY_SIZE}
                onMouseDown={onMouseDown}
                onSelectArtwork={onSelectArtwork}
                isOutOfBounds={isOutOfBounds}
              />
            </div>
          </div>

          {/* Action Trigger Bars Footer Options */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center box-border">
            <div className="flex gap-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#17191b] hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <PlusIcon style={{ width: "14px", height: "14px" }} />
                Upload Design
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml" 
                onChange={onAddArtwork} 
                className="hidden" 
              />
              
              {artworks.length > 0 && (
                <button 
                  onClick={() => selectedArtworkId && onRemoveArtwork(selectedArtworkId)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <TrashIcon style={{ width: "14px", height: "14px" }} />
                  Remove Selected
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 📦 RIGHT COLUMN PANEL: Immersive Real-Time 3D Viewport Inspection Hub */}
        <section className="flex-1 flex flex-col bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm min-h-[550px]">
          <div className="p-4 border-b border-gray-50 bg-white">
            <h2 className="text-base font-bold text-[#17191b m-0">Live 3D Preview</h2>
          </div>

          {/* Responsive WebGL Scene Frame Viewport */}
          <div className="flex-grow bg-[#ddd9d4] relative">
            {modelUrl ? (
              <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-600">
                  Assembling 3D customizer container...
                </div>
              }>
                <Canvas shadows camera={{ position: [0, 1.2, 3.2], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
                  <ambientLight intensity={0.2} />
                  <pointLight position={[10, 10, 10]} intensity={0.2} castShadow />
                  <Stage environment="warehouse" intensity={0.2} adjustCamera={false} shadows="contact">
                    <ModelViewport
                      modelUrl={modelUrl}
                      textureCanvas={textureCanvas}
                      packageColor={packageColor}
                    />
                  </Stage>
                  <OrbitControls enableZoom minDistance={0.1} maxDistance={0.5} />
                </Canvas>
              </Suspense>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                ⚠️ No matching mesh connected for preview
              </div>
            )}
          </div>

          {/* Core Controls Dashboard Panel Menu Sheet */}
          <div className="p-6 bg-white flex flex-col gap-5 box-border border-t border-gray-50">
            
            {/* Color Matrix Controller Selector */}
            <div>
              <label className="text-xs font-bold text-[#5e5e5c] mb-2 block uppercase tracking-wider">
                Base Glaze Color
              </label>
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex gap-2.5">
                  <button onClick={() => onColorChange("#F4F2EE")} className={`w-8 h-8 rounded-full border cursor-pointer transition-all hover:scale-105 ${packageColor === '#F4F2EE' ? 'ring-2 ring-offset-2 ring-[#17191b] border-transparent' : 'border-gray-200'}`} style={{ backgroundColor: "#F4F2EE" }} title="Ivory Matte" />
                  <button onClick={() => onColorChange("#E2E2E5")} className={`w-8 h-8 rounded-full border cursor-pointer transition-all hover:scale-105 ${packageColor === '#E2E2E5' ? 'ring-2 ring-offset-2 ring-[#17191b] border-transparent' : 'border-gray-200'}`} style={{ backgroundColor: "#E2E2E5" }} title="Slate Gray" />
                  <button onClick={() => onColorChange("#2C2E30")} className={`w-8 h-8 rounded-full border cursor-pointer transition-all hover:scale-105 ${packageColor === '#2C2E30' ? 'ring-2 ring-offset-2 ring-[#17191b] border-transparent' : 'border-gray-200'}`} style={{ backgroundColor: "#2C2E30" }} title="Onyx" />
                  <button onClick={() => onColorChange("#E6E2DC")} className={`w-8 h-8 rounded-full border cursor-pointer transition-all hover:scale-105 ${packageColor === '#E6E2DC' ? 'ring-2 ring-offset-2 ring-[#17191b] border-transparent' : 'border-gray-200'}`} style={{ backgroundColor: "#E6E2DC" }} title="Sandstone" />
                </div>

                {/* Extended Dynamic Custom Grid Palette Box */}
                <div className="relative">
                  <button 
                    onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                    className="p-1.5 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                    title="Pick Custom Color"
                  >
                    {/* 💡 FIXED: Replaced web icon font tag with native Radix Mixer icon */}
                    <MixerHorizontalIcon style={{ width: "16px", height: "16px", color: "#5e5e5c" }} />
                  </button>

                  {isColorPickerOpen && (
                      <>
                        {/* Transparent clicking mask backdrop to handle clean click-away dismiss actions */}
                        <div className="fixed inset-0 z-20" onClick={() => setIsColorPickerOpen(false)} />
                        
                        {/* Floating picker bubble anchored above the layout palette icon trigger */}
                        <div className="absolute bottom-full mb-3 left-0 z-30 animate-fade-in">
                          <ColorPicker 
                            value={packageColor} 
                            onChange={onColorChange} 
                          />
                        </div>
                      </>
                    )}
                </div>

                {/* Digital Precision HEX Form Vector */}
                <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 px-3 py-1.5 ml-1">
                  <span className="text-xs font-bold text-gray-400 mr-2 select-none">HEX</span>
                  <input 
                    type="text" 
                    value={packageColor} 
                    onChange={(e) => onColorChange(e.target.value)}
                    className="bg-transparent border-none p-0 w-20 text-xs font-semibold text-[#17191b] uppercase outline-none focus:ring-0" 
                    placeholder="#FFFFFF" 
                  />
                </div>
              </div>
            </div>

            {/* Gloss Matrix Toggle Elements */}
            <div>
              <label className="text-xs font-bold text-[#5e5e5c] mb-2 block uppercase tracking-wider">
                Finish Texture
              </label>
              <div className="flex p-1 bg-gray-100 rounded-lg w-fit">
                <button 
                  onClick={() => setActiveFinish('matte')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer transition-all ${activeFinish === 'matte' ? 'bg-white shadow-sm text-[#17191b]' : 'text-[#5e5e5c] hover:text-[#17191b]'}`}
                >
                  Matte
                </button>
                <button 
                  onClick={() => setActiveFinish('gloss')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold border-none cursor-pointer transition-all ${activeFinish === 'gloss' ? 'bg-white shadow-sm text-[#17191b]' : 'text-[#5e5e5c] hover:text-[#17191b]'}`}
                >
                  Gloss
                </button>
              </div>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
import { useState, useRef, useCallback, useEffect } from "react";
import { startTransition } from "react";
import type { ArtworkObject, DielineConfig } from "../types/customizer";

interface DragState {
  artworkId: string;
  startX: number;
  startY: number;
  initialArtX: number;
  initialArtY: number;
}

interface UseArtworkEditorReturn {
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  textureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  setSelectedArtworkId: (id: string | null) => void;
  handleTextureUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    dieline: DielineConfig
  ) => void;
  handleMouseDown: (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => void;
  handleMouseMove: (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => void;
  handleMouseUp: () => void;
  handleScaleChange: (newScale: number, dieline: DielineConfig) => void;
  removeArtwork: (id: string) => void;
  clearArtworks: () => void;
  isOutOfBounds: (art: ArtworkObject, dieline: DielineConfig) => boolean;
  selectedArtwork: ArtworkObject | null;
  getCurrentScale: (dieline: DielineConfig) => number;
}

export function useArtworkEditor(): UseArtworkEditorReturn {
  const [artworks, setArtworks] = useState<ArtworkObject[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setRenderTick] = useState(0);

  const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

// Composite artworks onto the hidden texture canvas with dynamic resolution handling
  const composite = useCallback(
    (currentArtworks: ArtworkObject[], dieline: DielineConfig, targetSize: number = 1024) => {
      const canvas = textureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 💡 DYNAMIC RESOLUTION: Set the canvas boundaries to the size requested by the active view
      canvas.width = targetSize;
      canvas.height = targetSize;
      ctx.clearRect(0, 0, targetSize, targetSize);

      // Dynamically calculate the scale multiplier based on the requested canvas resolution
      const scaleMultiplier = targetSize / 1024;
      
      for (const art of currentArtworks) {
        ctx.drawImage(
          art.image,
          (dieline.printX + art.x) * scaleMultiplier,
          (dieline.printY + art.y) * scaleMultiplier,
          art.w * scaleMultiplier,
          art.h * scaleMultiplier
        );
      }
      setRenderTick((t) => t + 1);
    },
    []
  );

  const handleTextureUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, dieline: DielineConfig) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
          // 💡 Math bounds safely containerized matching your old layout properties
          const maxW = dieline.printW * 0.5;
          const aspect = img.width / img.height;
          const w = maxW;
          const h = maxW / aspect;

          const newArt: ArtworkObject = {
            id: `art_${Date.now()}`,
            image: img,
            dataUrl,
            x: dieline.printW / 2 - w / 2,
            y: dieline.printH / 2 - h / 2, // Centers perfectly within the 256px vertical limit
            w,
            h,
          };

          startTransition(() => {
            setArtworks((prev) => {
              const next = [...prev, newArt];
              composite(next, dieline, 1024); // Ensure new uploads are composited at the correct resolution immediately
              return next;
            });
            setSelectedArtworkId(newArt.id);
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [composite]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => {
      if (!selectedArtworkId) return;
      const art = artworks.find((a) => a.id === selectedArtworkId);
      if (!art) return;
      setIsDragging(true);
      dragStateRef.current = {
        artworkId: selectedArtworkId,
        startX: e.clientX,
        startY: e.clientY,
        initialArtX: art.x,
        initialArtY: art.y,
      };
    },
    [selectedArtworkId, artworks]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => {
      const drag = dragStateRef.current;
      if (!isDragging || !drag) return;

      const ratio = dieline.printW / displaySize;
      const dx = (e.clientX - drag.startX) * ratio;
      const dy = (e.clientY - drag.startY) * ratio;

      setArtworks((prev) => {
        const next = prev.map((a) =>
          a.id === drag.artworkId
            ? { ...a, x: drag.initialArtX + dx, y: drag.initialArtY + dy }
            : a
        );
        composite(next, dieline);
        return next;
      });
    },
    [isDragging, composite]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStateRef.current = null;
  }, []);

  const handleScaleChange = useCallback(
    (newScale: number, dieline: DielineConfig) => {
      setArtworks((prev) => {
        const next = prev.map((a) => {
          if (a.id !== selectedArtworkId) return a;
          const aspect = a.image.width / a.image.height;
          const baseW = dieline.printW * 0.5;
          const w = baseW * newScale;
          const h = w / aspect;
          const cx = a.x + a.w / 2;
          const cy = a.y + a.h / 2;
          return { ...a, w, h, x: cx - w / 2, y: cy - h / 2 };
        });
        composite(next, dieline, 1024);
        return next;
      });
    },
    [selectedArtworkId, composite]
  );

  const removeArtwork = useCallback((id: string) => {
    setArtworks((prev) => prev.filter((a) => a.id !== id));
    setSelectedArtworkId((current) => (current === id ? null : current));
  }, []);

  const clearArtworks = useCallback(() => {
    setArtworks([]);
    setSelectedArtworkId(null);
  }, []);

  const isOutOfBounds = useCallback(
    (art: ArtworkObject, dieline: DielineConfig): boolean =>
      art.x < 0 ||
      art.y < 0 ||
      art.x + art.w > dieline.printW ||
      art.y + art.h > dieline.printH,
    []
  );

  const selectedArtwork =
    artworks.find((a) => a.id === selectedArtworkId) ?? null;

  const getCurrentScale = useCallback(
    (dieline: DielineConfig): number => {
      if (!selectedArtwork) return 1.0;
      return selectedArtwork.w / (dieline.printW * 0.5);
    },
    [selectedArtwork]
  );

  return {
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
    selectedArtwork,
    getCurrentScale,
  };
}
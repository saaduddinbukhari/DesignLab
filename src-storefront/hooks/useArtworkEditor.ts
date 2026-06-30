import { useState, useRef, useCallback, useEffect } from "react";
import { startTransition } from "react";
import type { ArtworkObject, DielineConfig } from "../types/customizer";
import type { ResizeHandle } from "../components/ArtworkCanvas";

// ─── Extended ArtworkObject ───────────────────────────────────────────────────
// (Extend your existing type or override locally — same shape, extra optional fields)
export interface ArtworkObjectEx extends ArtworkObject {
  rotation: number;   // degrees
  opacity: number;    // 0–1
  flipX: boolean;
  flipY: boolean;
  zIndex: number;
}

// ─── Internal drag/transform states ──────────────────────────────────────────
interface DragState {
  artworkId: string;
  startX: number;
  startY: number;
  initialArtX: number;
  initialArtY: number;
}

interface ResizeState {
  artworkId: string;
  handle: ResizeHandle;
  startX: number;
  startY: number;
  initialX: number;
  initialY: number;
  initialW: number;
  initialH: number;
  ratio: number; // dieline:display
}

interface RotateState {
  artworkId: string;
  centerX: number; // viewport px
  centerY: number;
  startAngle: number; // angle of mouse at drag start (degrees)
  initialRotation: number;
}

type TransformMode = "idle" | "drag" | "resize" | "rotate";

// ─── Return type ─────────────────────────────────────────────────────────────
export interface UseArtworkEditorReturn {
  artworks: ArtworkObjectEx[];
  selectedArtworkId: string | null;
  isDragging: boolean;
  textureCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  canUndo: boolean;
  canRedo: boolean;
  setSelectedArtworkId: (id: string | null) => void;
  handleTextureUpload: (e: React.ChangeEvent<HTMLInputElement>, dieline: DielineConfig) => void;
  handleMouseDown: (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => void;
  handleMouseMove: (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => void;
  handleMouseUp: () => void;
  handleResizeStart: (e: React.MouseEvent, handle: ResizeHandle, dieline: DielineConfig, displaySize: number) => void;
  handleRotateStart: (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => void;
  handleScaleChange: (newScale: number, dieline: DielineConfig) => void;
  handleOpacityChange: (opacity: number, dieline: DielineConfig) => void;
  handleFlip: (axis: "x" | "y", dieline: DielineConfig) => void;
  handleLayerMove: (id: string, direction: "up" | "down", dieline: DielineConfig) => void;
  removeArtwork: (id: string, dieline: DielineConfig) => void;
  clearArtworks: () => void;
  undo: () => void;
  redo: () => void;
  isOutOfBounds: (art: ArtworkObjectEx, dieline: DielineConfig) => boolean;
  selectedArtwork: ArtworkObjectEx | null;
  getCurrentScale: (dieline: DielineConfig) => number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useArtworkEditor(): UseArtworkEditorReturn {
  const [artworks, setArtworks] = useState<ArtworkObjectEx[]>([]);
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [transformMode, setTransformMode] = useState<TransformMode>("idle");
  const [, setRenderTick] = useState(0);

  // Undo/redo stacks (store snapshots of artworks array)
  const undoStack = useRef<ArtworkObjectEx[][]>([]);
  const redoStack = useRef<ArtworkObjectEx[][]>([]);

  const textureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const resizeStateRef = useRef<ResizeState | null>(null);
  const rotateStateRef = useRef<RotateState | null>(null);

  // ── Snapshot helpers ──────────────────────────────────────────────────────
  const pushUndo = useCallback((prev: ArtworkObjectEx[]) => {
    undoStack.current.push(prev.map((a) => ({ ...a })));
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    const snapshot = undoStack.current.pop();
    if (!snapshot) return;
    setArtworks((cur) => {
      redoStack.current.push(cur.map((a) => ({ ...a })));
      return snapshot;
    });
  }, []);

  const redo = useCallback(() => {
    const snapshot = redoStack.current.pop();
    if (!snapshot) return;
    setArtworks((cur) => {
      undoStack.current.push(cur.map((a) => ({ ...a })));
      return snapshot;
    });
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedArtworkId) {
        // Note: caller passes dieline; we just signal removal here (handled via removeArtwork)
        // Fire a custom event so OverviewPanel can intercept
        window.dispatchEvent(new CustomEvent("artwork:delete", { detail: { id: selectedArtworkId } }));
      }
      if (e.key === "[" && selectedArtworkId) {
        window.dispatchEvent(new CustomEvent("artwork:layer", { detail: { id: selectedArtworkId, direction: "down" } }));
      }
      if (e.key === "]" && selectedArtworkId) {
        window.dispatchEvent(new CustomEvent("artwork:layer", { detail: { id: selectedArtworkId, direction: "up" } }));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, selectedArtworkId]);

  // ── Composite ──────────────────────────────────────────────────────────────
  const composite = useCallback(
    (currentArtworks: ArtworkObjectEx[], dieline: DielineConfig, targetSize = 1024) => {
      const canvas = textureCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = targetSize;
      canvas.height = targetSize;
      ctx.clearRect(0, 0, targetSize, targetSize);

      const scale = targetSize / 1024;
      // Sort by zIndex ascending before compositing
      const sorted = [...currentArtworks].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));

      for (const art of sorted) {
        const cx = (dieline.printX + art.x + art.w / 2) * scale;
        const cy = (dieline.printY + art.y + art.h / 2) * scale;
        const dw = art.w * scale;
        const dh = art.h * scale;
        const rot = ((art.rotation ?? 0) * Math.PI) / 180;
        const sx = art.flipX ? -1 : 1;
        const sy = art.flipY ? -1 : 1;

        ctx.save();
        ctx.globalAlpha = art.opacity ?? 1;
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.scale(sx, sy);
        ctx.drawImage(art.image, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
      setRenderTick((t) => t + 1);
    },
    []
  );

  // ── Upload ────────────────────────────────────────────────────────────────
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
          const maxW = dieline.printW * 0.5;
          const aspect = img.width / img.height;
          const w = maxW;
          const h = maxW / aspect;
          const newArt: ArtworkObjectEx = {
            id: `art_${Date.now()}`,
            image: img,
            dataUrl,
            x: dieline.printW / 2 - w / 2,
            y: dieline.printH / 2 - h / 2,
            w,
            h,
            rotation: 0,
            opacity: 1,
            flipX: false,
            flipY: false,
            zIndex: Date.now(),
          };
          startTransition(() => {
            setArtworks((prev) => {
              pushUndo(prev);
              const next = [...prev, newArt];
              composite(next, dieline, 1024);
              return next;
            });
            setSelectedArtworkId(newArt.id);
          });
        };
      };
      reader.readAsDataURL(file);
    },
    [composite, pushUndo]
  );

  // ── Drag ─────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => {
      if (!selectedArtworkId) return;
      const art = artworks.find((a) => a.id === selectedArtworkId);
      if (!art) return;
      setTransformMode("drag");
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

  // ── Resize ────────────────────────────────────────────────────────────────
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: ResizeHandle, dieline: DielineConfig, displaySize: number) => {
      e.preventDefault();
      if (!selectedArtworkId) return;
      const art = artworks.find((a) => a.id === selectedArtworkId);
      if (!art) return;
      setTransformMode("resize");
      resizeStateRef.current = {
        artworkId: selectedArtworkId,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        initialX: art.x,
        initialY: art.y,
        initialW: art.w,
        initialH: art.h,
        ratio: dieline.printW / displaySize,
      };
    },
    [selectedArtworkId, artworks]
  );

  // ── Rotate ────────────────────────────────────────────────────────────────
  const handleRotateStart = useCallback(
    (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => {
      e.preventDefault();
      if (!selectedArtworkId) return;
      const art = artworks.find((a) => a.id === selectedArtworkId);
      if (!art) return;

      const ratio = dieline.printW / displaySize;
      // Compute artwork center in viewport space — we need the canvas bounding rect
      // We store the center in terms of clientX/Y at drag start
      const el = (e.target as HTMLElement).closest("[data-artwork-canvas]") as HTMLElement | null;
      // Fallback: approximate from known canvas position
      setTransformMode("rotate");
      rotateStateRef.current = {
        artworkId: selectedArtworkId,
        // Center of the artwork in viewport coords (approximate; refined in mousemove)
        centerX: 0,
        centerY: 0,
        startAngle: 0,
        initialRotation: art.rotation ?? 0,
      };

      // We'll compute the real center on first mousemove
      rotateStateRef.current.startAngle = NaN;
    },
    [selectedArtworkId, artworks]
  );

  // ── MouseMove (handles drag, resize, rotate) ──────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent, dieline: DielineConfig, displaySize: number) => {
      if (transformMode === "drag") {
        const drag = dragStateRef.current;
        if (!drag) return;
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
      } else if (transformMode === "resize") {
        const rs = resizeStateRef.current;
        if (!rs) return;
        const dx = (e.clientX - rs.startX) * rs.ratio;
        const dy = (e.clientY - rs.startY) * rs.ratio;

        setArtworks((prev) => {
          const next = prev.map((a) => {
            if (a.id !== rs.artworkId) return a;
            let { x, y, w, h } = { x: rs.initialX, y: rs.initialY, w: rs.initialW, h: rs.initialH };
            const MIN = 20;

            // Adjust based on handle
            if (rs.handle.includes("e")) w = Math.max(MIN, rs.initialW + dx);
            if (rs.handle.includes("s")) h = Math.max(MIN, rs.initialH + dy);
            if (rs.handle.includes("w")) { w = Math.max(MIN, rs.initialW - dx); x = rs.initialX + rs.initialW - w; }
            if (rs.handle.includes("n")) { h = Math.max(MIN, rs.initialH - dy); y = rs.initialY + rs.initialH - h; }

            return { ...a, x, y, w, h };
          });
          composite(next, dieline);
          return next;
        });
      } else if (transformMode === "rotate") {
        const rot = rotateStateRef.current;
        if (!rot) return;

        // On first move, compute center using the event's currentTarget (the overlay div)
        const overlayEl = (e.currentTarget as HTMLElement);
        const overlayRect = overlayEl.getBoundingClientRect();

        // Find the artwork's display coords from state
        setArtworks((prev) => {
          const art = prev.find((a) => a.id === rot.artworkId);
          if (!art) return prev;

          const ratio = dieline.printW / displaySize;
          const canvasPaddingLeft = overlayRect.width / 2 - displaySize / 2;
          const canvasPaddingTop = overlayRect.height / 2 - displaySize / 2;
          const artCx = canvasPaddingLeft + art.x / ratio + (art.w / ratio) / 2;
          const artCy = canvasPaddingTop + art.y / ratio + (art.h / ratio) / 2;

          const cx = overlayRect.left + artCx;
          const cy = overlayRect.top + artCy;

          const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;

          if (isNaN(rot.startAngle)) {
            rot.startAngle = angle;
            rot.centerX = cx;
            rot.centerY = cy;
            return prev;
          }

          const deltaAngle = angle - rot.startAngle;
          const newRotation = rot.initialRotation + deltaAngle;

          const next = prev.map((a) =>
            a.id === rot.artworkId ? { ...a, rotation: newRotation } : a
          );
          composite(next, dieline);
          return next;
        });
      }
    },
    [transformMode, composite]
  );

  const handleMouseUp = useCallback(() => {
    if (transformMode !== "idle") {
      // Push undo snapshot after transform ends
      setArtworks((cur) => {
        pushUndo(cur);
        return cur;
      });
    }
    setTransformMode("idle");
    dragStateRef.current = null;
    resizeStateRef.current = null;
    rotateStateRef.current = null;
  }, [transformMode, pushUndo]);

  // ── Scale slider ──────────────────────────────────────────────────────────
  const handleScaleChange = useCallback(
    (newScale: number, dieline: DielineConfig) => {
      setArtworks((prev) => {
        pushUndo(prev);
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
    [selectedArtworkId, composite, pushUndo]
  );

  // ── Opacity ───────────────────────────────────────────────────────────────
  const handleOpacityChange = useCallback(
    (opacity: number, dieline: DielineConfig) => {
      setArtworks((prev) => {
        const next = prev.map((a) =>
          a.id === selectedArtworkId ? { ...a, opacity } : a
        );
        composite(next, dieline);
        return next;
      });
    },
    [selectedArtworkId, composite]
  );

  // ── Flip ─────────────────────────────────────────────────────────────────
  const handleFlip = useCallback(
    (axis: "x" | "y", dieline: DielineConfig) => {
      setArtworks((prev) => {
        pushUndo(prev);
        const next = prev.map((a) => {
          if (a.id !== selectedArtworkId) return a;
          return axis === "x" ? { ...a, flipX: !a.flipX } : { ...a, flipY: !a.flipY };
        });
        composite(next, dieline);
        return next;
      });
    },
    [selectedArtworkId, composite, pushUndo]
  );

  // ── Layer reorder ────────────────────────────────────────────────────────
  const handleLayerMove = useCallback(
    (id: string, direction: "up" | "down", dieline: DielineConfig) => {
      setArtworks((prev) => {
        pushUndo(prev);
        const sorted = [...prev].sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
        const idx = sorted.findIndex((a) => a.id === id);
        if (idx === -1) return prev;
        const swapIdx = direction === "up" ? idx + 1 : idx - 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
        const tempZ = sorted[idx].zIndex;
        sorted[idx] = { ...sorted[idx], zIndex: sorted[swapIdx].zIndex };
        sorted[swapIdx] = { ...sorted[swapIdx], zIndex: tempZ };
        composite(sorted, dieline);
        return sorted;
      });
    },
    [composite, pushUndo]
  );

  // ── Remove ────────────────────────────────────────────────────────────────
  const removeArtwork = useCallback(
    (id: string, dieline: DielineConfig) => {
      setArtworks((prev) => {
        pushUndo(prev);
        const next = prev.filter((a) => a.id !== id);
        composite(next, dieline);
        return next;
      });
      setSelectedArtworkId((cur) => (cur === id ? null : cur));
    },
    [composite, pushUndo]
  );

  const clearArtworks = useCallback(() => {
    setArtworks([]);
    setSelectedArtworkId(null);
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  const isOutOfBounds = useCallback(
    (art: ArtworkObjectEx, dieline: DielineConfig): boolean =>
      art.x < 0 || art.y < 0 || art.x + art.w > dieline.printW || art.y + art.h > dieline.printH,
    []
  );

  const selectedArtwork = artworks.find((a) => a.id === selectedArtworkId) ?? null;

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
    isDragging: transformMode === "drag",
    textureCanvasRef,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    setSelectedArtworkId,
    handleTextureUpload,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleResizeStart,
    handleRotateStart,
    handleScaleChange,
    handleOpacityChange,
    handleFlip,
    handleLayerMove,
    removeArtwork,
    clearArtworks,
    undo,
    redo,
    isOutOfBounds,
    selectedArtwork,
    getCurrentScale,
  };
}
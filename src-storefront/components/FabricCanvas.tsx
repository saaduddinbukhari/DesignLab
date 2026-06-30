import { useEffect, useRef, useCallback } from "react";
import {
  Canvas as FabricCanvasClass,
  FabricImage,
  IText,
  Rect,
  Ellipse,
  Triangle,
  ActiveSelection,
  type FabricObject,
  type TEvent,
} from "fabric";
import type { ArtworkObject, DielineConfig, BlendMode } from "../types/customizer";

// ─── Constants ────────────────────────────────────────────────────────────────

const SNAP_THRESHOLD = 8; // px — snap-to-grid / snap-to-center tolerance
const GRID_SIZE = 20;     // px — background grid cell size (cosmetic)
const SAFE_ZONE_INSET = 20; // px in displaySize space — bleed warning band

// ─── Props ────────────────────────────────────────────────────────────────────

interface FabricCanvasProps {
  artworks: ArtworkObject[];
  selectedArtworkId: string | null;
  selectedIds: string[];
  displaySize: number;
  dieline: DielineConfig;
  textureCanvas: HTMLCanvasElement | null;
  showSafeZone: boolean;

  onSelectArtwork: (id: string | null) => void;
  onSelectMultiple: (ids: string[]) => void;

  // Full state writeback — called after any Fabric interaction
  onUpdateArtwork: (id: string, patch: Partial<ArtworkObject>) => void;
  onUpdateTexture?: () => void;
}

// ─── Coordinate helpers ───────────────────────────────────────────────────────

/** Convert artwork print-space coords → Fabric canvas px */
function artToPx(art: ArtworkObject, displaySize: number, dieline: DielineConfig) {
  const scaleX = displaySize / dieline.printW;
  const scaleY = displaySize / dieline.printH;
  return {
    left:  (art.x + art.w / 2) * scaleX,
    top:   (art.y + art.h / 2) * scaleY,
    scaleX: (art.w / (art.image?.naturalWidth  || art.w)) * scaleX,
    scaleY: (art.h / (art.image?.naturalHeight || art.h)) * scaleY,
  };
}

/** Convert Fabric object position back to print-space */
function pxToArt(
  obj: FabricObject,
  displaySize: number,
  dieline: DielineConfig,
  naturalW: number,
  naturalH: number
): Partial<ArtworkObject> {
  const scaleX = dieline.printW / displaySize;
  const scaleY = dieline.printH / displaySize;
  const w = (obj.getScaledWidth())  * scaleX;
  const h = (obj.getScaledHeight()) * scaleY;
  const cx = (obj.left ?? 0) * scaleX;
  const cy = (obj.top  ?? 0) * scaleY;
  return {
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h,
    rotation: obj.angle ?? 0,
  };
}

// ─── Snap helpers ─────────────────────────────────────────────────────────────

function snapValue(v: number, targets: number[], threshold: number): number {
  for (const t of targets) {
    if (Math.abs(v - t) < threshold) return t;
  }
  return v;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FabricCanvas({
  artworks,
  selectedArtworkId,
  selectedIds,
  displaySize,
  dieline,
  showSafeZone,
  onSelectArtwork,
  onSelectMultiple,
  onUpdateArtwork,
  onUpdateTexture,
}: FabricCanvasProps) {
  const containerRef = useRef<HTMLCanvasElement>(null);
  const fabricRef    = useRef<FabricCanvasClass | null>(null);
  const isFromProps  = useRef(false);

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!containerRef.current) return;

    const canvas = new FabricCanvasClass(containerRef.current, {
      width: displaySize,
      height: displaySize,
      backgroundColor: "transparent",
      preserveObjectStacking: true,
      stopContextMenu: true,
    });
    fabricRef.current = canvas;

    // Selection handle styling — v7 uses classRegistry defaults via prototype
    FabricObject.ownDefaults = {
      ...FabricObject.ownDefaults,
      borderColor: "#17191b",
      cornerColor: "#ffffff",
      cornerStrokeColor: "#17191b",
      cornerSize: 9,
      cornerStyle: "circle",
      transparentCorners: false,
      padding: 5,
    };

    // ── Selection events ────────────────────────────────────────────────────

    canvas.on("selection:created", (e) => {
      if (isFromProps.current) return;
      const objs = canvas.getActiveObjects() as any[];
      const ids = objs.map((o) => o.artId).filter(Boolean);
      onSelectMultiple(ids);
      onSelectArtwork(ids[0] ?? null);
    });

    canvas.on("selection:updated", () => {
      if (isFromProps.current) return;
      const objs = canvas.getActiveObjects() as any[];
      const ids = objs.map((o) => o.artId).filter(Boolean);
      onSelectMultiple(ids);
      onSelectArtwork(ids[0] ?? null);
    });

    canvas.on("selection:cleared", () => {
      if (isFromProps.current) return;
      onSelectMultiple([]);
      onSelectArtwork(null);
    });

    // ── Object modified — write back to React state ─────────────────────────

    const writeBack = (e: TEvent & { target?: FabricObject }) => {
      if (isFromProps.current || !e.target) return;
      const targets = (e.target as any).type === "activeSelection"
        ? (e.target as ActiveSelection).getObjects()
        : [e.target];

      targets.forEach((obj: any) => {
        if (!obj.artId) return;
        const art = artworks.find((a) => a.id === obj.artId);
        if (!art) return;
        const nw = art.image?.naturalWidth  || art.w;
        const nh = art.image?.naturalHeight || art.h;
        const patch = pxToArt(obj, displaySize, dieline, nw, nh);
        onUpdateArtwork(obj.artId, patch);
      });

      if (onUpdateTexture) onUpdateTexture();
    };

    canvas.on("object:modified", writeBack);
    canvas.on("object:moving",   writeBack);
    canvas.on("object:scaling",  writeBack);
    canvas.on("object:rotating", writeBack);

    // ── Snap-to-grid / snap-to-center on move ──────────────────────────────

    canvas.on("object:moving", (e) => {
      const obj = e.target;
      if (!obj) return;
      const cx = displaySize / 2;
      const cy = displaySize / 2;

      // Snap horizontal centre & left edge
      const snapXTargets = [cx, 0, displaySize];
      const snapYTargets = [cy, 0, displaySize];

      const objCx = (obj.left ?? 0);
      const objCy = (obj.top  ?? 0);

      obj.set({
        left: snapValue(objCx, snapXTargets, SNAP_THRESHOLD),
        top:  snapValue(objCy, snapYTargets, SNAP_THRESHOLD),
      });
      obj.setCoords();
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [displaySize]); // intentionally omit callbacks — stable via useCallback in parent

  // ── Sync artworks → Fabric objects ───────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    isFromProps.current = true;

    const existing = new Map<string, FabricObject>(
      canvas.getObjects().map((o: any) => [o.artId, o])
    );

    const sorted = [...artworks].sort((a, b) => a.zIndex - b.zIndex);
    const promises: Promise<void>[] = [];

    sorted.forEach((art) => {
      const exObj = existing.get(art.id) as any;
      const scaleX_px = displaySize / dieline.printW;
      const scaleY_px = displaySize / dieline.printH;

      const commonProps = {
        left:    (art.x + art.w / 2) * scaleX_px,
        top:     (art.y + art.h / 2) * scaleY_px,
        originX: "center" as const,
        originY: "center" as const,
        angle:   art.rotation ?? 0,
        opacity: art.opacity  ?? 1,
        flipX:   art.flipX    ?? false,
        flipY:   art.flipY    ?? false,
      };

      if (exObj) {
        // ── Update existing ───────────────────────────────────────────────

        if (art.type === "image") {
          const nw = (art.image?.naturalWidth  || 1);
          const nh = (art.image?.naturalHeight || 1);
          exObj.set({
            ...commonProps,
            scaleX: (art.w / nw) * scaleX_px,
            scaleY: (art.h / nh) * scaleY_px,
          });
        } else if (art.type === "text") {
          exObj.set({
            ...commonProps,
            text:       art.text      ?? "",
            fontSize:   art.fontSize  ?? 48,
            fontFamily: art.fontFamily ?? "serif",
            fill:       art.textColor ?? "#000000",
          });
        } else if (art.type === "shape") {
          exObj.set({
            ...commonProps,
            fill: art.fillColor ?? "#000000",
            width:  art.w * scaleX_px,
            height: art.h * scaleY_px,
          });
        }

        exObj.setCoords();
        existing.delete(art.id);

      } else {
        // ── Create new ────────────────────────────────────────────────────

        const p = new Promise<void>((resolve) => {
          if (art.type === "image" && art.dataUrl) {
            FabricImage.fromURL(art.dataUrl, { crossOrigin: "anonymous" })
              .then((img) => {
                const nw = img.width  || 1;
                const nh = img.height || 1;
                (img as any).artId = art.id;
                img.set({
                  ...commonProps,
                  scaleX: (art.w / nw) * scaleX_px,
                  scaleY: (art.h / nh) * scaleY_px,
                });
                canvas.add(img);
                canvas.sendObjectToBack(img);
                resolve();
              })
              .catch(() => resolve());
          } else if (art.type === "text") {
            const txt = new IText(art.text ?? "Text", {
              ...(commonProps as any),
              fontSize:   art.fontSize  ?? 48,
              fontFamily: art.fontFamily ?? "serif",
              fill:       art.textColor ?? "#000000",
            });
            (txt as any).artId = art.id;
            canvas.add(txt);

            // Double-click to edit text inline
            txt.on("editing:exited", () => {
              onUpdateArtwork(art.id, { text: txt.text });
            });
            resolve();
          } else if (art.type === "shape") {
            let shape: FabricObject;
            const w = art.w * scaleX_px;
            const h = art.h * scaleY_px;
            if (art.shapeKind === "ellipse") {
              shape = new Ellipse({
                ...(commonProps as any),
                rx: w / 2,
                ry: h / 2,
                fill: art.fillColor ?? "#000000",
              });
            } else if (art.shapeKind === "triangle") {
              shape = new Triangle({
                ...(commonProps as any),
                width: w,
                height: h,
                fill: art.fillColor ?? "#000000",
              });
            } else {
              shape = new Rect({
                ...(commonProps as any),
                width: w,
                height: h,
                fill: art.fillColor ?? "#000000",
              });
            }
            (shape as any).artId = art.id;
            canvas.add(shape);
            resolve();
          } else {
            resolve();
          }
        });

        promises.push(p);
      }
    });

    // Remove objects that no longer exist in artworks
    existing.forEach((obj) => canvas.remove(obj));

    // After all async adds, re-apply z-order and restore selection
    Promise.all(promises).then(() => {
      // Re-order by zIndex
      const allObjs = canvas.getObjects() as any[];
      allObjs.sort((a, b) => {
        const aZ = artworks.find((x) => x.id === a.artId)?.zIndex ?? 0;
        const bZ = artworks.find((x) => x.id === b.artId)?.zIndex ?? 0;
        return aZ - bZ;
      });
      // Re-insert in order
      allObjs.forEach((o) => {
        canvas.remove(o);
        canvas.add(o);
      });

      // Restore selection
      if (selectedIds.length > 1) {
        const sel = canvas.getObjects().filter((o: any) => selectedIds.includes(o.artId));
        if (sel.length > 1) {
          const group = new ActiveSelection(sel, { canvas });
          canvas.setActiveObject(group);
        }
      } else if (selectedArtworkId) {
        const obj = canvas.getObjects().find((o: any) => o.artId === selectedArtworkId);
        if (obj) canvas.setActiveObject(obj);
      } else {
        canvas.discardActiveObject();
      }

      canvas.renderAll();
      isFromProps.current = false;
    });
  }, [artworks, selectedArtworkId, selectedIds, displaySize, dieline]);

  // ── Safe zone overlay ─────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove old safe zone objects
    const oldZone = canvas.getObjects().find((o: any) => o._isSafeZone);
    if (oldZone) canvas.remove(oldZone);

    if (!showSafeZone) {
      canvas.renderAll();
      return;
    }

    const inset = SAFE_ZONE_INSET;
    const rect = new Rect({
      left:    inset,
      top:     inset,
      width:   displaySize - inset * 2,
      height:  displaySize - inset * 2,
      fill:    "transparent",
      stroke:  "rgba(220,38,38,0.6)",
      strokeWidth: 1.5,
      strokeDashArray: [6, 4],
      selectable:  false,
      evented:     false,
      excludeFromExport: true,
    });
    (rect as any)._isSafeZone = true;
    canvas.add(rect);
    canvas.bringObjectToFront(rect);
    canvas.renderAll();
  }, [showSafeZone, displaySize]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: "relative",
        width:  `${displaySize}px`,
        height: `${displaySize}px`,
      }}
    >
      <canvas ref={containerRef} />
    </div>
  );
}
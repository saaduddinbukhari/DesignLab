"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";

type hsl = { h: number; s: number; l: number; };
type hex = { hex: string; };
type Color = hsl & hex;

const HashtagIcon = (props: React.ComponentPropsWithoutRef<"svg">) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M11.097 1.515a.75.75 0 0 1 .589.882L10.666 7.5h4.47l1.079-5.397a.75.75 0 1 1 1.47.294L16.665 7.5h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.2 6h3.585a.75.75 0 0 1 0 1.5h-3.885l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103h-4.47l-1.08 5.397a.75.75 0 1 1-1.47-.294l1.02-5.103H3.75a.75.75 0 0 1 0-1.5h3.885l1.2-6H5.25a.75.75 0 0 1 0-1.5h3.885l1.08-5.397a.75.75 0 0 1 .882-.588ZM10.365 9l-1.2 6h4.47l1.2-6h-4.47Z" clipRule="evenodd" />
  </svg>
);

function hslToHex({ h, s, l }: hsl) {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(Math.min(k(n) - 3, 9 - k(n), 1), -1);
  const toHex = (x: number) => {
    const hexStr = Math.round(255 * f(x)).toString(16);
    return hexStr.length === 1 ? "0" + hexStr : hexStr;
  };
  return `${toHex(0)}${toHex(8)}${toHex(4)}`.toUpperCase();
}

function hexToHsl({ hex }: hex): hsl {
  let cleanHex = hex.replace(/^#/, "");
  if (cleanHex.length === 3) cleanHex = cleanHex.split("").map(c => c + c).join("");
  while (cleanHex.length < 6) cleanHex += "0";

  let r = parseInt(cleanHex.slice(0, 2), 16) / 255;
  let g = parseInt(cleanHex.slice(2, 4), 16) / 255;
  let b = parseInt(cleanHex.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h / 6) * 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const DraggableColorCanvas = ({ h, s, l, handleChange }: hsl & { handleChange: (e: Partial<Color>) => void; }) => {
  const [dragging, setDragging] = useState(false);
  const colorAreaRef = useRef<HTMLDivElement>(null);

  const calculateSaturationAndLightness = useCallback((clientX: number, clientY: number) => {
    if (!colorAreaRef.current) return;
    const rect = colorAreaRef.current.getBoundingClientRect();
    const xClamped = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const yClamped = Math.max(0, Math.min(clientY - rect.top, rect.height));
    handleChange({ s: Math.round((xClamped / rect.width) * 100), l: 100 - Math.round((yClamped / rect.height) * 100) });
  }, [handleChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => { e.preventDefault(); calculateSaturationAndLightness(e.clientX, e.clientY); }, [calculateSaturationAndLightness]);
  const handleMouseUp = useCallback(() => setDragging(false), []);
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); setDragging(true); calculateSaturationAndLightness(e.clientX, e.clientY); };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={colorAreaRef}
      onMouseDown={handleMouseDown}
      style={{
        height: "140px",
        width: "100%",
        position: "relative",
        cursor: "crosshair",
        borderRadius: "8px",
        border: "1px solid #eef0f2",
        boxSizing: "border-box",
        background: `linear-gradient(to top, #000, transparent, #fff), linear-gradient(to left, hsl(${h}, 100%, 50%), #bbb)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          border: "2px solid #ffffff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.2)",
          background: `hsl(${h}, ${s}%, ${l}%)`,
          transform: "translate(-50%, -50%)",
          left: `${s}%`,
          top: `${100 - l}%`,
          cursor: dragging ? "grabbing" : "grab",
        }}
      />
    </div>
  );
};

interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value = "#F4F2EE", onChange }: ColorPickerProps) {
  const [color, setColor] = useState<Color>(() => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    return { ...hexToHsl({ hex: cleaned }), hex: cleaned };
  });

  useEffect(() => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (cleaned !== color.hex && cleaned.length === 6) {
      setColor({ ...hexToHsl({ hex: cleaned }), hex: cleaned });
    }
  }, [value]);

  return (
    <>
      <style
        id="slider-thumb-style"
        dangerouslySetInnerHTML={{
          __html: `
            input[type='range']::-webkit-slider-thumb {
              -webkit-appearance: none; appearance: none;
              width: 14px; height: 14px; background: #ffffff;
              border: 2px solid #17191b; cursor: pointer; border-radius: 50%;
            }
            input[type='range']::-moz-range-thumb {
              width: 14px; height: 14px; background: #ffffff;
              border: 2px solid #17191b; cursor: pointer; border-radius: 50%;
            }
          `,
        }}
      />
      
      {/* 🔮 Fixed Solid Interface Wrapper Box */}
      <div
        style={{
          width: "240px",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #ece7e2",
          boxShadow: "0px 8px 30px rgba(44, 46, 48, 0.12)",
          padding: "14px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <DraggableColorCanvas
          {...color}
          handleChange={(partial) => {
            setColor((prev) => {
              const next = { ...prev, ...partial };
              const formatted = hslToHex({ h: next.h, s: next.s, l: next.l });
              onChange(`#${formatted}`);
              return { ...next, hex: formatted };
            });
          }}
        />

        {/* Hue Tracking Slider Input bar */}
        <input
          type="range"
          min="0"
          max="360"
          value={color.h}
          style={{
            width: "100%",
            height: "10px",
            cursor: "pointer",
            appearance: "none",
            borderRadius: "999px",
            margin: 0,
            outline: "none",
            background: `linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
          }}
          onChange={(e) => {
            const hue = e.target.valueAsNumber;
            setColor((prev) => {
              const { hex, ...rest } = { ...prev, h: hue };
              const formatted = hslToHex({ ...rest });
              onChange(`#${formatted}`);
              return { ...rest, hex: formatted };
            });
          }}
        />

        {/* Precision Numeric Form Row block */}
        <div style={{ position: "relative", width: "100%", height: "36px", display: "flex", alignItems: "center" }}>
          <div style={{ position: "absolute", left: "10px", display: "flex", alignItems: "center", pointerEvents: "none" }}>
            <HashtagIcon style={{ width: "14px", height: "14px", color: "#949598" }} />
          </div>
          <input
            style={{
              width: "100%",
              height: "10px",
              boxSizing: "border-box",
              padding: "16px 40px 16px 26px",
              fontSize: "12px",
              fontWeight: "600",
              color: "#17191b",
              backgroundColor: "#f7f3ed",
              border: "1px solid #e6e2dc",
              borderRadius: "6px",
              letterSpacing: "0.05em",
              outline: "none"
            }}
            value={color.hex}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
              if (cleaned.length <= 6) {
                setColor(prev => ({ ...prev, hex: cleaned }));
                if (cleaned.length === 6) {
                  onChange(`#${cleaned}`);
                }
              }
            }}
          />
          <div style={{ position: "absolute", right: "6px", display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "4px",
                border: "1px solid rgba(0,0,0,0.05)",
                backgroundColor: `hsl(${color.h}, ${color.s}%, ${color.l}%)`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
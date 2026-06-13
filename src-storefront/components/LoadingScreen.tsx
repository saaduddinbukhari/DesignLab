import React, { useEffect, useRef } from "react";

interface LoadingScreenProps {
  animationUrl: string; // 💡 Passed down cleanly as an explicit prop
  message?: string;
}

export function LoadingScreen({ animationUrl, message = "Preparing your studio..." }: LoadingScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("lottie-web")
      .then((lottieModule) => {
        const lottie = lottieModule.default;
        if (!containerRef.current) return;

        const instance = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: animationUrl, // Directly uses the valid CDN route
        });

        return () => instance.destroy();
      })
      .catch((err) => {
        console.warn("Lottie canvas initialization bypassed:", err);
      });
  }, [animationUrl]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        minHeight: "400px",
        backgroundColor: "#f6fafe",
        fontFamily: "'Inter', sans-serif",
        gap: "16px",
      }}
    >
      <div ref={containerRef} style={{ width: "140px", height: "140px" }} />
      {message && <span className="animate-pulse font-medium text-sm text-[#3e4944]">{message}</span>}
    </div>
  );
}
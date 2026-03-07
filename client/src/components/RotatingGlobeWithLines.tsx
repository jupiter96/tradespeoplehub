import React, { useId } from "react";

const CX = 24;
const CY = 24;
const R = 22;

export default function RotatingGlobeWithLines() {
  const id = useId();
  const shadeId = `globe-shade-${id.replace(/:/g, "")}`;
  return (
    <div
      className="relative mx-auto flex items-center justify-center"
      style={{ width: 64, height: 64, minWidth: 64, minHeight: 64 }}
    >
      <style>{`
        @keyframes search-globe {
          0% { transform: translate(0, 0) scale(1); }
          20% { transform: translate(8px, -6px) scale(1.08); }
          40% { transform: translate(-6px, 6px) scale(0.96); }
          60% { transform: translate(-8px, -4px) scale(1.04); }
          80% { transform: translate(4px, 7px) scale(0.98); }
          100% { transform: translate(0, 0) scale(1); }
        }
      `}</style>
      <svg
        viewBox="0 0 48 48"
        width="64"
        height="64"
        style={{ display: "block", width: "100%", height: "100%" }}
        aria-hidden
      >
        <defs>
          <radialGradient id={shadeId} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fdba74" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FE8A0F" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ea580c" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        {/* Gradient globe circle only */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill={`url(#${shadeId})`}
          stroke="rgba(234, 88, 12, 0.5)"
          strokeWidth="0.8"
        />
        {/* Magnifying glass searching over the globe */}
        <g
          style={{
            animation: "search-globe 3s ease-in-out infinite",
            transformOrigin: "24px 24px",
          }}
        >
          <circle
            cx={CX}
            cy={CY}
            r={5}
            fill="none"
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1.2"
          />
          <line
            x1={28.5}
            y1={28.5}
            x2={33}
            y2={33}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}

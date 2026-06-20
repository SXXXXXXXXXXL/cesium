"use client";

import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

// Interface for props
interface MapComponentProps {
  inventory: {
    water: boolean;
    sediment: boolean;
    biota: boolean;
  };
  interviewDone: boolean;
  setActiveGame: (game: "map" | "water_game" | "sediment_game" | "biota_game" | "interview") => void;
}

export default function MapComponent({ inventory, interviewDone, setActiveGame }: MapComponentProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const scaleX = dimensions.width ? dimensions.width / 1000 : 1;
  const scaleY = dimensions.height ? dimensions.height / 600 : 1;
  const fitScale = Math.max(scaleX, scaleY);
  
  // Custom marker component to render glowing, interactive HTML overlays
  const renderHotspot = (
    key: "water" | "sediment" | "biota" | "jono",
    emoji: string,
    label: string,
    isCollected: boolean,
    style: React.CSSProperties,
    onClick: () => void
  ) => {
    return (
      <div
        onClick={onClick}
        style={{
          position: "absolute",
          transform: "translate(-50%, -50%)",
          ...style,
        }}
        className="cursor-pointer group flex flex-col items-center gap-1.5 z-20"
      >
        <div className="relative flex items-center justify-center">
          {/* Glowing pulse ring if not collected */}
          {!isCollected && (
            <div className="absolute w-10 h-10 bg-cyan-400/30 rounded-full animate-ping" />
          )}
          
          <div
            className={`w-9 h-9 bg-white border-2 rounded-full flex items-center justify-center shadow-md text-base transition-all duration-200 group-hover:scale-115 group-hover:shadow-lg ${
              isCollected
                ? "border-emerald-500 bg-emerald-50 text-emerald-600 font-bold"
                : "border-cyan-500 text-cyan-600"
            }`}
          >
            {emoji}
            {isCollected && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 text-white rounded-full border border-white flex items-center justify-center text-[8px] font-extrabold shadow-sm">
                ✓
              </div>
            )}
          </div>
        </div>
        <div className="px-2 py-0.5 bg-slate-900/90 text-white rounded text-[8px] font-mono font-extrabold uppercase tracking-wider shadow border border-slate-750/30 pointer-events-none whitespace-nowrap">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[450px] rounded-3xl overflow-hidden border border-slate-200 bg-[#e0f4f7] shadow-inner select-none flex-grow"
    >
      
      {/* Performant CSS animations for current flows and organic plume pulsing */}
      <style>{`
        @keyframes currents-flow {
          to {
            stroke-dashoffset: -40;
          }
        }
        .currents-flow-line {
          stroke-dasharray: 8 14;
          animation: currents-flow 3.5s linear infinite;
        }
        @keyframes plume-pulse {
          0% {
            opacity: 0.65;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.03);
          }
          100% {
            opacity: 0.65;
            transform: scale(0.97);
          }
        }
        .plume-blob {
          transform-origin: 500px 50px;
          animation: plume-pulse 8s ease-in-out infinite;
        }
        .panning-container {
          width: 100%;
          height: 100%;
        }
      `}</style>

      <TransformWrapper
        key={fitScale}
        initialScale={fitScale}
        minScale={fitScale}
        maxScale={fitScale * 3}
        centerOnInit={true}
        limitToBounds={true}
      >
        <TransformComponent wrapperClass="panning-container" contentClass="panning-container">
          
          {/* Zoomable Canvas Container */}
          <div 
            style={{ 
              position: "relative", 
              width: "1000px", 
              height: "600px", 
              cursor: "grab" 
            }}
            className="active:cursor-grabbing transition-shadow"
          >
            
            {/* SVG Base Layer (Coastlines, currents, plume) */}
            <svg 
              viewBox="0 0 1000 600" 
              className="absolute inset-0 w-full h-full select-none"
            >
              <defs>
                {/* Blur filter for organic contamination plume */}
                <filter id="plume-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="25" />
                </filter>

                {/* Layered radial gradient for plume warning colors */}
                <radialGradient id="plume-grad" cx="50%" cy="10%" r="75%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.45" />
                  <stop offset="30%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="65%" stopColor="#eab308" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Sea Background (Soft Medical Cyan) */}
              <rect width="1000" height="600" fill="#e0f4f7" />

              {/* Sea Floor Topological Contours */}
              <path d="M 200,280 C 350,310 650,310 800,280" fill="none" stroke="#bce6eb" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.6" />
              <path d="M 220,380 C 380,415 620,415 780,380" fill="none" stroke="#bce6eb" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.6" />
              <path d="M 240,460 C 400,490 600,490 760,460" fill="none" stroke="#bce6eb" strokeWidth="1.5" strokeDasharray="3 6" opacity="0.6" />

              {/* Fictional Contamination Plume (Pulses organically) */}
              <path
                d="M 450,50 C 450,180 320,280 260,380 C 230,480 320,560 520,530 C 720,480 740,350 630,250 C 550,180 550,100 550,50 Z"
                fill="url(#plume-grad)"
                filter="url(#plume-blur)"
                className="plume-blob"
              />

              {/* Ocean Current Flow Lines (Animated) */}
              {/* Center Flow */}
              <path
                d="M 500,80 C 500,160 520,240 590,320 C 640,370 680,440 700,520"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                className="currents-flow-line"
                opacity="0.6"
              />
              {/* Left Flow */}
              <path
                d="M 480,90 C 470,160 410,230 340,300 C 270,370 240,430 230,510"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                className="currents-flow-line"
                opacity="0.6"
              />
              {/* Right Flow */}
              <path
                d="M 520,90 C 530,160 620,230 690,300 C 760,370 790,430 800,510"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                className="currents-flow-line"
                opacity="0.6"
              />

              {/* Landmass Left / West Coast (Stylized off-white/beige) */}
              <path
                d="M 0,0 L 450,0 C 450,100 420,150 380,200 C 300,240 220,270 200,320 C 180,370 150,420 180,470 C 200,510 160,560 120,600 L 0,600 Z"
                fill="#f5f4f0"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Landmass Right / East Coast (Stylized off-white/beige) */}
              <path
                d="M 1000,0 L 550,0 C 550,100 580,150 620,200 C 700,240 780,270 800,320 C 820,370 850,420 820,470 C 800,510 840,560 880,600 L 1000,600 Z"
                fill="#f5f4f0"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Fictional Island in the bay */}
              <path
                d="M 320,360 C 320,330 370,320 390,340 C 410,360 420,400 390,420 C 360,440 320,410 320,360 Z"
                fill="#f5f4f0"
                stroke="#cbd5e1"
                strokeWidth="1.5"
              />

              {/* Fictional Island Contours */}
              <path d="M 330,360 C 330,345 365,335 380,350 C 395,365 390,390 380,400 C 360,410 330,395 330,360 Z" fill="none" stroke="#e3e1da" strokeWidth="1" opacity="0.6" />

              {/* Left Land Contour Lines */}
              <path d="M 0,100 C 100,110 180,140 220,200" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />
              <path d="M 0,250 C 50,260 110,290 130,320" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />

              {/* Right Land Contour Lines */}
              <path d="M 1000,100 C 900,110 820,140 780,200" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />

              {/* Fictional Industrial Facility / Factory on Northern Estuary left bank */}
              <g transform="translate(415, 20) scale(0.9)">
                {/* Building structure */}
                <path d="M 0,40 L 0,20 L 15,28 L 15,20 L 30,28 L 30,20 L 45,28 L 45,40 Z" fill="#64748b" stroke="#475569" strokeWidth="1.5" />
                {/* Smoke pipe */}
                <rect x="35" y="5" width="4" height="20" fill="#475569" />
                {/* Animated smoke particles (simple static circles for build compatibility) */}
                <circle cx="37" cy="-2" r="3" fill="#94a3b8" opacity="0.6" />
                <circle cx="42" cy="-9" r="4" fill="#94a3b8" opacity="0.4" />
                {/* Factory label */}
                <rect x="-10" y="42" width="65" height="12" rx="3" fill="#1e293b" />
                <text x="22.5" y="50" fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PLTN UTARA</text>
              </g>
            </svg>

            {/* Absolute HTML Hotspot Markers Overlay Layer (Scale/Pan relative) */}
            {renderHotspot(
              "water",
              "🧪",
              "Muara Sungai (Air)",
              inventory.water,
              { left: "500px", top: "160px" },
              () => setActiveGame("water_game")
            )}

            {renderHotspot(
              "jono",
              "⛵",
              "Pak Jono (Nelayan)",
              interviewDone,
              { left: "210px", top: "250px" },
              () => setActiveGame("interview")
            )}

            {renderHotspot(
              "sediment",
              "🕳️",
              "Palung Tengah (Sedimen)",
              inventory.sediment,
              { left: "620px", top: "320px" },
              () => setActiveGame("sediment_game")
            )}

            {renderHotspot(
              "biota",
              "🦀",
              "Terumbu Timur (Kepiting)",
              inventory.biota,
              { left: "310px", top: "430px" },
              () => setActiveGame("biota_game")
            )}

          </div>

        </TransformComponent>
      </TransformWrapper>

      {/* Static HUD Overlay Control Info */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-400 pointer-events-none flex flex-col gap-0.5">
        <span className="text-white font-bold uppercase tracking-wider">NAVIGASI PETA</span>
        <span>• Seret (Drag) untuk menggeser</span>
        <span>• Cubit / Roda (Scroll) untuk Zoom</span>
      </div>

    </div>
  );
}

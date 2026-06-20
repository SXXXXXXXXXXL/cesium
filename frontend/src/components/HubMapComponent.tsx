"use client";

import React from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useRouter } from "next/navigation";
import { Building, Beaker, Map } from "lucide-react";

// Interface for props
interface HubMapComponentProps {
  setActiveHover: (hover: string | null) => void;
  characterName: string;
}

export default function HubMapComponent({ setActiveHover, characterName }: HubMapComponentProps) {
  const router = useRouter();
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

  // Helper to render the interactive glowing markers
  const renderHubMarker = (
    emoji: React.ReactNode,
    label: string,
    key: "kantor" | "lab" | "peta",
    route: string,
    style: React.CSSProperties
  ) => {
    return (
      <div
        onClick={() => router.push(route)}
        onMouseEnter={() => setActiveHover(key)}
        onMouseLeave={() => setActiveHover(null)}
        style={{
          position: "absolute",
          transform: "translate(-50%, -50%)",
          ...style,
        }}
        className="cursor-pointer group flex flex-col items-center gap-1.5 z-20"
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-11 h-11 bg-cyan-400/25 rounded-full animate-ping opacity-60" />
          <div className="w-10 h-10 bg-white border-2 border-cyan-500 text-cyan-600 rounded-2xl shadow-md flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-hover:shadow-lg group-hover:border-cyan-600 group-hover:text-cyan-700">
            {emoji}
          </div>
        </div>
        <div className="px-2 py-0.5 bg-slate-900/90 text-white rounded text-[8.5px] font-mono font-extrabold uppercase tracking-wider shadow border border-slate-750/30 pointer-events-none whitespace-nowrap">
          {label}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full min-h-[400px] rounded-3xl overflow-hidden border border-slate-200 bg-[#e0f4f7] shadow-inner select-none flex-grow"
    >
      
      {/* Map Pan-Zoom wrapper style config */}
      <style>{`
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
              cursor: "grab",
            }}
            className="active:cursor-grabbing"
          >
            
            {/* SVG Base Layer (Coastlines, docks, boat, wave vectors) */}
            <svg
              viewBox="0 0 1000 600"
              className="absolute inset-0 w-full h-full select-none"
            >
              {/* Sea Background (Soft Medical Cyan) */}
              <rect width="1000" height="600" fill="#e0f4f7" />

              {/* Sea Waves Shapes */}
              <path d="M 0,450 Q 250,420 500,450 T 1000,450 L 1000,600 L 0,600 Z" fill="#d0eff2" opacity="0.5" />
              <path d="M 0,500 Q 300,480 600,510 T 1000,500 L 1000,600 L 0,600 Z" fill="#bde7ed" opacity="0.4" />

              {/* Left Shore Coastline (Soft Warm Beige) */}
              <path
                d="M 0,0 L 400,0 C 400,120 370,180 300,220 C 220,265 180,310 180,360 C 180,420 120,480 80,600 L 0,600 Z"
                fill="#f5f4f0"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Right Shore Coastline (Soft Warm Beige) */}
              <path
                d="M 1000,0 L 600,0 C 600,120 630,180 700,220 C 780,265 820,310 820,360 C 820,420 880,480 920,600 L 1000,600 Z"
                fill="#f5f4f0"
                stroke="#cbd5e1"
                strokeWidth="2"
              />

              {/* Left Land Contour Lines */}
              <path d="M 0,120 C 100,130 180,160 220,210" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />
              <path d="M 0,260 C 60,270 120,300 140,340" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />

              {/* Right Land Contour Lines */}
              <path d="M 1000,120 C 900,130 820,160 780,210" fill="none" stroke="#e3e1da" strokeWidth="1.5" opacity="0.6" />

              {/* Pier 1 (extends from left shore) */}
              <rect x="300" y="200" width="130" height="16" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="330" y1="216" x2="330" y2="230" stroke="#64748b" strokeWidth="2" />
              <line x1="370" y1="216" x2="370" y2="230" stroke="#64748b" strokeWidth="2" />
              <line x1="410" y1="216" x2="410" y2="230" stroke="#64748b" strokeWidth="2" />

              {/* Pier 2 (extends from right shore) */}
              <rect x="570" y="200" width="130" height="16" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="600" y1="216" x2="600" y2="230" stroke="#64748b" strokeWidth="2" />
              <line x1="640" y1="216" x2="640" y2="230" stroke="#64748b" strokeWidth="2" />
              <line x1="680" y1="216" x2="680" y2="230" stroke="#64748b" strokeWidth="2" />

              {/* Pier 3 (Main Pier extending from water center) */}
              <rect x="485" y="210" width="30" height="150" rx="4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
              {/* Mooring posts */}
              <circle cx="500" cy="230" r="3" fill="#475569" />
              <circle cx="500" cy="270" r="3" fill="#475569" />
              <circle cx="500" cy="310" r="3" fill="#475569" />
              <circle cx="500" cy="350" r="3" fill="#475569" />

              {/* Orange Boat outline docked at Main Pier */}
              <g transform="translate(520, 270) scale(0.8)">
                <path d="M 10,25 L 50,25 L 60,10 L 0,10 Z" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
                <rect x="25" y="0" width="3" height="10" fill="#475569" />
                <polygon points="28,0 38,3 28,6" fill="#f1f5f9" />
              </g>

            </svg>

            {/* Glowing Map Hotspots Overlay */}
            {renderHubMarker(
              <Building className="w-5 h-5" />,
              "Kantor Misi",
              "kantor",
              "/kantor",
              { left: "260px", top: "180px" }
            )}

            {renderHubMarker(
              <Beaker className="w-5 h-5" />,
              "Laboratorium",
              "lab",
              "/lab",
              { left: "580px", top: "170px" }
            )}

            {renderHubMarker(
              <Map className="w-5 h-5" />,
              "Sampling Laut",
              "peta",
              "/fieldwork",
              { left: "500px", top: "380px" }
            )}

          </div>

        </TransformComponent>
      </TransformWrapper>

      {/* Static HUD Overlay Control Info */}
      <div className="absolute bottom-4 left-4 z-10 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-400 pointer-events-none flex flex-col gap-0.5">
        <span className="text-white font-bold uppercase tracking-wider">NAVIGASI HUB</span>
        <span>• Seret (Drag) untuk menggeser</span>
        <span>• Cubit / Roda (Scroll) untuk Zoom</span>
      </div>

    </div>
  );
}

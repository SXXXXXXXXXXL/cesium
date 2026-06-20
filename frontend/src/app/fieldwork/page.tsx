"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Anchor, 
  ArrowLeft, 
  Info, 
  Compass, 
  CheckCircle2, 
  RotateCcw,
  Volume2,
  VolumeX
} from "lucide-react";
import { useDrag } from "react-use-gesture";
import { Howl, Howler } from "howler";
import { api } from "../../lib/api";

const MapComponent = dynamic(() => import("../../components/MapComponent"), { ssr: false });

type ActiveGame = "map" | "water_game" | "sediment_game" | "biota_game" | "interview";
type ShovelState = "empty" | "full";

const GEIGER_CLICK_URI = "data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YQoAAAAA/v8BAP7/AgD+Kw==";

export default function FieldworkPage() {
  const router = useRouter();
  
  const [characterName, setCharacterName] = useState("Dokter Rad");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const char = localStorage.getItem("cesium_character");
      if (char) {
        setCharacterName(char);
      }
    }
  }, []);
  
  // Game states
  const [activeGame, setActiveGame] = useState<ActiveGame>("map");
  const [inventory, setInventory] = useState({ water: false, sediment: false, biota: false });
  const [interviewDone, setInterviewDone] = useState(false);
  const [monologue, setMonologue] = useState("Saya sudah sampai di Teluk Biru. Saya harus mengambil sampel air, sedimen lumpur, dan biota kepiting untuk melacak sumber kontaminasi.");
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);

  // Precision Pouring states (Water Sampler)
  const [waterLevel, setWaterLevel] = useState(0);
  const [pourStatus, setPourStatus] = useState<"idle" | "pouring" | "success" | "fail">("idle");
  const [isBottleOverBeaker, setIsBottleOverBeaker] = useState(false);
  const [bottleKey, setBottleKey] = useState(0);
  
  const waterLevelRef = useRef(waterLevel);
  useEffect(() => {
    waterLevelRef.current = waterLevel;
  }, [waterLevel]);

  // HTML Refs for collision checking
  const bottleRef = useRef<HTMLDivElement>(null);
  const beakerRef = useRef<HTMLDivElement>(null);
  const pourTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Digging states (Sediment Sampler)
  const [shovelState, setShovelState] = useState<ShovelState>("empty");
  const [digProgress, setDigProgress] = useState(0);
  const [digSuccess, setDigSuccess] = useState(false);
  const [shovelText, setShovelText] = useState("Sekop Kosong");
  
  const shovelRef = useRef<HTMLDivElement>(null);
  const soilRef = useRef<HTMLDivElement>(null);
  const jarRef = useRef<HTMLDivElement>(null);

  // Biota drag-to-scan Geiger Radar states
  const [scanProgress, setScanProgress] = useState(0);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [reticlePos, setReticlePos] = useState({ x: 30, y: 30 });
  const [hotspotPos, setHotspotPos] = useState({ x: 130, y: 130 });
  const [isMuted, setIsMuted] = useState(false);

  const isMutedRef = useRef(isMuted);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Interview state (First-Person thought logs from Jono)
  const [interviewStep, setInterviewStep] = useState<"intro" | "q1" | "q2" | "q3" | "thank">("intro");
  
  // Howler and audio contexts for Geiger beeps
  const geigerHowlRef = useRef<Howl | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const s = await api.getSamples();
        setInventory({
          water: s.some((x: any) => x.type === "water"),
          sediment: s.some((x: any) => x.type === "sediment"),
          biota: s.some((x: any) => x.type === "biota")
        });

        const p = await api.getProgress();
        setInterviewDone(p.fishermanInterviewed);
        if (p.fishermanInterviewed) {
          setInterviewStep("thank");
        }
        setScore(p.score);
        setXp(p.xp);
      } catch (e) {
        console.error(e);
      }
    };
    loadState();
  }, []);

  // Initialize howler
  useEffect(() => {
    geigerHowlRef.current = new Howl({
      src: [GEIGER_CLICK_URI],
      format: ["wav"],
      volume: 0.4
    });

    return () => {
      if (geigerHowlRef.current) {
        geigerHowlRef.current.unload();
      }
    };
  }, []);

  // COLLISION DETECTION HELPER
  const checkOverlap = (el1: HTMLElement | null, el2: HTMLElement | null) => {
    if (!el1 || !el2) return false;
    const r1 = el1.getBoundingClientRect();
    const r2 = el2.getBoundingClientRect();
    
    return !(
      r1.right < r2.left ||
      r1.left > r2.right ||
      r1.bottom < r2.top ||
      r1.top > r2.bottom
    );
  };

  // Water Pouring loops
  const handleWaterDrag = () => {
    if (pourStatus === "success") return;

    const overlap = checkOverlap(bottleRef.current, beakerRef.current);
    setIsBottleOverBeaker(overlap);

    if (overlap) {
      if (!pourTimerRef.current) {
        setPourStatus("pouring");
        setMonologue("Botol miring. Air mengalir masuk ke dalam gelas beaker...");
        pourTimerRef.current = setInterval(() => {
          const current = waterLevelRef.current;
          if (current >= 600) {
            if (pourTimerRef.current) {
              clearInterval(pourTimerRef.current);
              pourTimerRef.current = null;
            }
            setPourStatus("fail");
            setMonologue("Tumpah! Saya mengisinya terlalu penuh. Saya harus menuang ulang.");
            return;
          }
          setWaterLevel(current + 2);
        }, 30);
      }
    } else {
      if (pourTimerRef.current) {
        setPourStatus("idle");
        clearInterval(pourTimerRef.current);
        pourTimerRef.current = null;
      }
    }
  };

  const handleWaterDragEnd = async () => {
    if (pourTimerRef.current) {
      clearInterval(pourTimerRef.current);
      pourTimerRef.current = null;
    }

    if (pourStatus === "success") return;

    if (isBottleOverBeaker) {
      const currentLevel = waterLevelRef.current;
      if (currentLevel >= 500 && currentLevel <= 506) {
        setPourStatus("success");
        setInventory(prev => ({ ...prev, water: true }));
        setMonologue("Bagus! Pengukuran air pas 500ml. Sampel air telah dikunci.");
        try {
          await api.createSample("water", "Muara Sungai (Utara)", 125.8);
          const p = await api.getProgress();
          await api.updateProgress({ score: p.score + 30, xp: p.xp + 50 });
        } catch (e) {
          console.error(e);
        }
      } else {
        setPourStatus("fail");
        setMonologue("Volume air salah! Harus tepat di garis 500ml (500ml - 506ml). Silakan reset.");
      }
    } else {
      setPourStatus("idle");
    }
  };

  const resetWaterGame = () => {
    if (pourTimerRef.current) {
      clearInterval(pourTimerRef.current);
      pourTimerRef.current = null;
    }
    setWaterLevel(0);
    setPourStatus("idle");
    setIsBottleOverBeaker(false);
    setBottleKey(prev => prev + 1);
  };

  // Sediment scoop-and-dump loops
  const handleShovelDrag = () => {
    if (digSuccess) return;

    const shovel = shovelRef.current;
    const soil = soilRef.current;
    const jar = jarRef.current;

    if (shovelState === "empty") {
      const overlapSoil = checkOverlap(shovel, soil);
      if (overlapSoil) {
        setShovelState("full");
        setShovelText("Sekop Penuh");
        setMonologue("Sekop penuh dengan tanah dan lumpur. Sekarang seret dan tuang ke dalam toples sampel.");
      }
    }
  };

  const handleShovelDragEnd = async () => {
    if (digSuccess) return;

    const shovel = shovelRef.current;
    const jar = jarRef.current;

    if (shovelState === "full") {
      const overlapJar = checkOverlap(shovel, jar);
      if (overlapJar) {
        setShovelState("empty");
        setShovelText("Sekop Kosong");
        setDigProgress((prev) => {
          const next = prev + 25;
          if (next >= 100) {
            handleDigComplete();
            return 100;
          }
          setMonologue(`Satu sekop dimasukkan. Toples terisi ${next}%. Butuh beberapa sekop lagi.`);
          return next;
        });
      }
    }
  };

  const handleDigComplete = async () => {
    setDigSuccess(true);
    setInventory(prev => ({ ...prev, sediment: true }));
    setMonologue("Toples sampel sedimen dasar laut terisi penuh. Lumpur palung berhasil diamankan.");
    try {
      await api.createSample("sediment", "Palung Tengah Laut", 52.0);
      const p = await api.getProgress();
      await api.updateProgress({ score: p.score + 30, xp: p.xp + 50 });
    } catch (e) {
      console.error(e);
    }
  };

  const resetSedimentGame = () => {
    setDigProgress(0);
    setDigSuccess(false);
    setShovelState("empty");
    setShovelText("Sekop Kosong");
  };

  const handleScanComplete = async () => {
    setScanSuccess(true);
    setInventory(prev => ({ ...prev, biota: true }));
    setMonologue("Sinyal gamma kepiting terkunci! Sampel biota kepiting telah diamankan.");
    try {
      await api.createSample("biota", "Terumbu Karang (Timur)", 96.4);
      const p = await api.getProgress();
      await api.updateProgress({ score: p.score + 30, xp: p.xp + 50 });
    } catch (e) {
      console.error(e);
    }
  };

  // BIOTA GEIGER COUNTER AUDIO LOGIC
  const playGeigerClick = () => {
    if (isMutedRef.current) return;
    if (geigerHowlRef.current) {
      try {
        geigerHowlRef.current.play();
      } catch (e) {
        playOscillatorFallback();
      }
    } else {
      playOscillatorFallback();
    }
  };

  const playOscillatorFallback = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.012);
    } catch (e) {
      // Audio contexts blocked
    }
  };

  const calculateScannerDistance = () => {
    const dx = reticlePos.x - hotspotPos.x;
    const dy = reticlePos.y - hotspotPos.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // React Use Gesture useDrag for scanner
  const bindScanner = useDrag((state: any) => {
    // Resume audio context immediately on drag start or movement
    try {
      if (Howler && Howler.ctx && Howler.ctx.state === "suspended") {
        Howler.ctx.resume();
      }
    } catch (e) {}
    try {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
    } catch (e) {}

    if (scanSuccess) return;
    const [x, y] = state.offset;
    const boundedX = Math.max(0, Math.min(240, x));
    const boundedY = Math.max(0, Math.min(240, y));
    setReticlePos({ x: boundedX, y: boundedY });
  }, {
    bounds: { left: 0, right: 240, top: 0, bottom: 240 },
    from: () => [reticlePos.x, reticlePos.y]
  });

  // Store refs to avoid dependency-triggered intervals clearing on move
  const reticlePosRef = useRef(reticlePos);
  useEffect(() => {
    reticlePosRef.current = reticlePos;
  }, [reticlePos]);

  // Geiger clicking speeds & continuous 2-second lock timer loop
  useEffect(() => {
    if (activeGame !== "biota_game" || scanSuccess) {
      setScanProgress(0);
      return;
    }

    let lastClickTime = Date.now();
    let lockAccumulator = 0; // ms spent near hotspot

    const interval = setInterval(() => {
      const dx = reticlePosRef.current.x - hotspotPos.x;
      const dy = reticlePosRef.current.y - hotspotPos.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      // 1. Determine Geiger click interval
      let clickInterval = 1200;
      if (d < 25) {
        clickInterval = 60; // Geiger chatter near hotspot
      } else if (d < 60) {
        clickInterval = 180;
      } else if (d < 120) {
        clickInterval = 380;
      } else if (d < 200) {
        clickInterval = 700;
      }

      const now = Date.now();
      if (now - lastClickTime >= clickInterval) {
        playGeigerClick();
        lastClickTime = now;
      }

      // 2. Lock check (2 seconds to lock)
      if (d < 25) {
        lockAccumulator += 50; // tick every 50ms
        const progress = Math.min(100, Math.floor((lockAccumulator / 2000) * 100));
        setScanProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          handleScanComplete();
        }
      } else {
        lockAccumulator = 0;
        setScanProgress(0);
      }
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [activeGame, scanSuccess]);

  // Informant dialogue trees
  const handleFishermanAnswer = async () => {
    setInterviewDone(true);
    setInterviewStep("thank");
    setMonologue("Keterangan saksi cocok: pembuangan cairan hitam pekat terjadi di sektor utara pada Hari -10.");
    try {
      const p = await api.getProgress();
      await api.updateProgress({
        fishermanInterviewed: true,
        score: p.score + 20,
        xp: p.xp + 40
      });
    } catch (e) {
      console.error(e);
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  const isAllCollected = inventory.water && inventory.sediment && inventory.biota;

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springTransition}
        className="w-full bg-white border-b border-slate-200 py-3 px-6 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-med-teal flex items-center justify-center text-white shadow-teal-glow">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-slate-800 font-sans">{characterName}: Misi Lapangan</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Dermaga Teluk Biru</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (activeGame !== "map") {
                setActiveGame("map");
              } else {
                router.push("/hub");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 
            {activeGame !== "map" ? "Peta Lokasi" : "Keluar Hub"}
          </button>
        </div>
      </motion.header>

      {/* Main Canvas */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Interactive Side */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col gap-4 flex-grow min-h-[440px] relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              
              {/* MAP SELECT */}
              {activeGame === "map" && (
                <motion.div 
                  key="map"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="w-full h-full flex flex-col gap-4 flex-grow"
                >
                  <div className="mb-4">
                    <h3 className="text-md font-bold text-slate-700 font-sans">Peta Sebaran &amp; Pola Kontaminasi</h3>
                    <p className="text-xs text-slate-500">Klik penanda/marker di bawah untuk melakukan investigasi lapangan:</p>
                  </div>

                  <MapComponent
                    inventory={inventory}
                    interviewDone={interviewDone}
                    setActiveGame={setActiveGame}
                  />
                </motion.div>
              )}

              {/* WATER POURING GAME */}
              {activeGame === "water_game" && (
                <motion.div 
                  key="water"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex-grow flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h3 className="text-md font-bold text-slate-800">Precision Drag-to-Pour</h3>
                    <p className="text-xs text-slate-500">Seret/Drag botol biru di atas gelas beaker untuk menuang air secara otomatis. Lepas saat volume pas 500ml!</p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-center gap-16 flex-grow py-8 bg-sky-50/20 rounded-2xl border border-sky-100 my-4 relative">
                    
                    {/* Draggable Bottle */}
                    <motion.div 
                      key={`bottle-${bottleKey}`}
                      ref={bottleRef}
                      drag
                      dragMomentum={false}
                      onDrag={handleWaterDrag}
                      onDragEnd={handleWaterDragEnd}
                      animate={isBottleOverBeaker ? { rotate: 45 } : { rotate: 0 }}
                      className="w-20 h-44 bg-sky-100/50 border-2 border-slate-350 rounded-2xl cursor-grab active:cursor-grabbing flex flex-col justify-between p-2 shadow z-25 relative"
                    >
                      <div className="w-6 h-3 bg-slate-400 mx-auto rounded-md -mt-3.5 border border-slate-300" />
                      
                      {/* Bottle body wrapper for liquid fill */}
                      <div className="w-full flex-grow relative rounded-xl overflow-hidden my-2 bg-slate-100/30 flex items-end">
                        <div 
                          className="w-full bg-med-cyan/35 rounded-b-lg" 
                          style={{ height: `${Math.max(0, 100 - (waterLevel / 600) * 100)}%` }} 
                        />
                      </div>

                      <span className="text-[9px] font-mono font-bold text-slate-400 text-center block">SAMPEL</span>
                    </motion.div>

                    {/* Target Beaker (Fixed scaling markers strictly proportional) */}
                    <div 
                      ref={beakerRef}
                      className={`w-32 h-60 border-x-4 border-b-4 rounded-b-2xl relative shadow-md transition-colors duration-300 bg-white/70 ${pourStatus === "fail" ? "border-red-400 bg-red-50/20" : "border-slate-450"}`}
                    >
                      {/* Inner beaker wrapper to sync scale markings and liquid */}
                      <div className="absolute inset-0 p-1 flex items-end">
                        
                        {/* Scale markings mathematically mapped absolute */}
                        <div className="absolute inset-0 left-2 right-2 text-[8px] font-mono text-slate-400 pointer-events-none z-10 select-none">
                          {/* 600ml = 0% from top */}
                          <div className="absolute top-0">600ml</div>
                          <div className="absolute top-0 left-8 right-0 border-t border-slate-200" />
                          
                          {/* 500ml = 16.67% from top */}
                          <div className="absolute top-[16.67%] left-0 right-0 text-med-cyan-dark font-extrabold border-t-2 border-med-cyan-dark flex justify-between">
                            <span>══ TARGET (500ml) ══</span>
                          </div>
                          
                          {/* 300ml = 50% from top */}
                          <div className="absolute top-[50%]">300ml</div>
                          <div className="absolute top-[50%] left-8 right-0 border-t border-slate-200" />
                          
                          {/* 150ml = 75% from top */}
                          <div className="absolute top-[75%]">150ml</div>
                          <div className="absolute top-[75%] left-8 right-0 border-t border-slate-200" />
                        </div>

                        {/* Liquid volume filled */}
                        <div 
                          className="w-full bg-med-cyan/35 border-t border-med-cyan rounded-b-xl" 
                          style={{ height: `${(waterLevel / 600) * 100}%` }} 
                        />
                      </div>

                      {/* Math perfect text sync */}
                      <span className="absolute top-2 right-2 font-mono text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                        {waterLevel.toFixed(0)} ml
                      </span>
                    </div>

                  </div>

                  <div className="flex gap-4">
                    {pourStatus === "success" ? (
                      <button 
                        onClick={() => setActiveGame("map")}
                        className="flex-grow py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
                      >
                        Sampel Terkunci. Kembali ke Peta Lapangan
                      </button>
                    ) : (
                      <>
                        <div className="flex-grow text-center text-xs font-bold text-slate-400 py-3">
                          {pourStatus === "pouring" ? "Sedang Menuangkan..." : "Tahan botol di atas gelas beaker..."}
                        </div>
                        {pourStatus === "fail" && (
                          <button 
                            onClick={resetWaterGame}
                            className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl flex items-center justify-center"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* SEDIMENT SAMPLER (SCOOP AND DUMP) */}
              {activeGame === "sediment_game" && (
                <motion.div 
                  key="sediment"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex-grow flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h3 className="text-md font-bold text-slate-800">Sedimen Shovel (Scoop &amp; Dump)</h3>
                    <p className="text-xs text-slate-500">1. Tarik sekop merah ke Zona Pasir untuk mengambil sedimen. 2. Tarik sekop penuh ke Toples dan lepaskan sekop di sana.</p>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-around flex-grow py-8 bg-amber-50/10 rounded-2xl border border-amber-100 my-4 relative">
                    
                    {/* Soil pile zone */}
                    <div 
                      ref={soilRef}
                      className="w-48 h-36 bg-amber-200/40 border-2 border-dashed border-amber-300 rounded-3xl flex flex-col items-center justify-center relative shadow-sm"
                    >
                      <span className="text-3xl animate-pulse">🪨</span>
                      <span className="text-[9px] font-mono font-bold text-amber-700 mt-2">ZONA PASIR / SEDIMEN</span>
                    </div>

                    {/* Shovel element (Draggable) */}
                    {!digSuccess && (
                      <motion.div 
                        ref={shovelRef}
                        drag
                        dragMomentum={false}
                        onDrag={handleShovelDrag}
                        onDragEnd={handleShovelDragEnd}
                        className={`w-14 h-14 rounded-2xl cursor-grab active:cursor-grabbing flex flex-col items-center justify-center text-xl shadow-md border z-25 relative ${shovelState === "full" ? "bg-amber-800 border-amber-900 text-white" : "bg-red-500 border-red-650 text-white"}`}
                      >
                        <span>{shovelState === "full" ? "🪨" : "🥄"}</span>
                        <span className="text-[7px] font-bold block leading-none mt-1">{shovelText}</span>
                      </motion.div>
                    )}

                    {/* Target Jar */}
                    <div 
                      ref={jarRef}
                      className="w-24 h-40 bg-white/70 border-x-4 border-b-4 border-slate-400 rounded-b-2xl relative shadow-md flex flex-col justify-end p-1 min-w-[100px] items-center"
                    >
                      <div className="w-8 h-4 bg-slate-500 rounded-t -mt-5 absolute top-4" />
                      {/* Filling progress */}
                      <div 
                        className="w-full bg-amber-900/45 border-t border-amber-950 rounded-b-xl transition-all" 
                        style={{ height: `${digProgress}%` }} 
                      />
                      <span className="absolute top-6 font-mono text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                        {digProgress}%
                      </span>
                    </div>

                  </div>

                  <div className="flex gap-4">
                    {digSuccess ? (
                      <button 
                        onClick={() => setActiveGame("map")}
                        className="flex-grow py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
                      >
                        Sampel Sedimen Siap. Kembali ke Peta Lapangan
                      </button>
                    ) : (
                      <>
                        <div className="flex-grow text-center text-xs font-bold text-slate-400 py-3">
                          Urutan: {shovelState === "empty" ? "Seret sekop ke Pasir..." : "Bawa sekop penuh ke toples..."}
                        </div>
                        {digProgress > 0 && (
                          <button 
                            onClick={resetSedimentGame}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-2xl flex items-center justify-center"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {/* BIOTA TACTILE DRAG-TO-SCAN RADAR */}
              {activeGame === "biota_game" && (
                <motion.div 
                  key="biota"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex-grow flex flex-col justify-between"
                >
                  <div className="mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="text-md font-bold text-slate-800">Biota Scanner (Karang Timur)</h3>
                      <p className="text-xs text-slate-500">Seret/Drag reticle scanner cangkang kepiting untuk mengunci paparan. Howler beep melaju di dekat hotspot.</p>
                    </div>
                    
                    <button 
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-med-cyan" />}
                    </button>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-around flex-grow py-8 bg-teal-50/10 rounded-2xl border border-teal-100 my-4 relative gap-6">
                    
                    {/* Scanner Dish (240x240 px) */}
                    <div 
                      id="radar-canvas"
                      onPointerDown={() => {
                        try {
                          if (Howler && Howler.ctx && Howler.ctx.state === "suspended") {
                            Howler.ctx.resume();
                          }
                        } catch (err) {}
                        try {
                          if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                            audioCtxRef.current.resume();
                          }
                        } catch (err) {}
                      }}
                      className="w-[240px] h-[240px] bg-slate-900 border-2 border-slate-800 rounded-3xl relative overflow-hidden shrink-0 cursor-crosshair shadow-inner"
                    >
                      <div className="absolute w-[180px] h-[180px] border border-slate-850 rounded-full top-[30px] left-[30px] opacity-40" />
                      <div className="absolute w-[100px] h-[100px] border border-slate-850 rounded-full top-[70px] left-[70px] opacity-20" />
                      
                      {/* Pulse ring near hotspot */}
                      {calculateScannerDistance() < 60 && !scanSuccess && (
                        <div className="absolute w-12 h-12 border-2 border-cyan-500/30 rounded-full animate-ping" style={{ left: hotspotPos.x - 24, top: hotspotPos.y - 24 }} />
                      )}

                      {/* Small visual indicator of hotspot for gameplay hint */}
                      <div className="absolute w-2 h-2 bg-cyan-400/10 rounded-full" style={{ left: hotspotPos.x - 4, top: hotspotPos.y - 4 }} />

                      {/* Draggable transparent scanner reticle (react-use-gesture) */}
                      {!scanSuccess && (
                        <div 
                          {...bindScanner()}
                          className="w-12 h-12 border-2 border-dashed border-cyan-400 rounded-full flex items-center justify-center absolute bg-cyan-950/20 shadow-md touch-none"
                          style={{ 
                            left: reticlePos.x - 24, 
                            top: reticlePos.y - 24,
                            cursor: "grab"
                          }}
                        >
                          <div 
                            onPointerDown={() => {
                              try {
                                if (Howler && Howler.ctx && Howler.ctx.state === "suspended") {
                                  Howler.ctx.resume();
                                }
                              } catch (err) {}
                              try {
                                if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
                                  audioCtxRef.current.resume();
                                }
                              } catch (err) {}
                            }}
                            className="w-2.5 h-2.5 bg-cyan-450 rounded-full animate-pulse cursor-pointer" 
                          />
                        </div>
                      )}
                    </div>

                    {/* Progress lock-on status */}
                    <div className="space-y-4 max-w-xs flex-grow">
                      <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-900 font-bold text-[9px] tracking-widest uppercase font-mono">
                        Kalibrasi Sinyal
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-500 font-sans">
                        Temukan hotspot radiasi pada kepiting. Laju beeper Geiger klik melaju dekat target. Pertahankan posisi sensor di atas hotspot selama 2 detik.
                      </p>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 font-mono">
                          <span>Mengunci Sinyal:</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-med-cyan transition-all" style={{ width: `${scanProgress}%` }} />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="flex gap-4">
                    {scanSuccess ? (
                      <button 
                        onClick={() => setActiveGame("map")}
                        className="flex-grow py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs shadow-md transition-all"
                      >
                        Sampel Biota Terbaca. Kembali ke Peta Lapangan
                      </button>
                    ) : (
                      <div className="flex-grow text-center text-xs font-bold text-slate-450 py-3 font-sans">
                        Seret sensor cawan... (Laju deteksi: {scanProgress}%)
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* NELEYAN DIALOG TREE */}
              {activeGame === "interview" && (
                <motion.div 
                  key="interview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full flex-grow flex flex-col justify-between"
                >
                  <div className="mb-4">
                    <h3 className="text-md font-bold text-slate-800">Bukti Nelayan (Pak Jono)</h3>
                    <p className="text-xs text-slate-500">Kumpulkan kronologi kejadian dari saksi nelayan setempat.</p>
                  </div>

                  <div className="flex-grow py-6 px-4 bg-slate-50 rounded-2xl border border-slate-150 my-4 flex flex-col justify-between min-h-[220px]">
                    <div className="text-sm leading-relaxed text-slate-600 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
                      {interviewStep === "intro" && (
                        <p><strong>Monolog:</strong> Saya harus menanyakan nelayan di dermaga mengenai kapal pembuang limbah dan bau aneh logam ini.</p>
                      )}
                      {interviewStep === "q1" && (
                        <p><strong>Pak Jono:</strong> "Kapal tongkang industri melaju pelan tanpa lampu di muara utara tengah malam. Bau logam menyengat tercium tepat setelahnya."</p>
                      )}
                      {interviewStep === "q2" && (
                        <p><strong>Pak Jono:</strong> "Air sungai di utara tampak agak keruh berminyak dan berkilau kebiruan jika disorot senter malam hari."</p>
                      )}
                      {interviewStep === "q3" && (
                        <p><strong>Pak Jono:</strong> "Tangkapan tiram tiris lemas. Kepiting di karang timur juga tidak bergeser sama sekali dari dasar pasir."</p>
                      )}
                      {interviewStep === "thank" && (
                        <p><strong>Monolog:</strong> Keterangan Pak Jono klop. Tangki cairan hitam pekat mengandung Cs-137 dilepas pada Hari -10 di muara utara.</p>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      {interviewStep === "intro" && !interviewDone && (
                        <button 
                          onClick={() => setInterviewStep("q1")}
                          className="w-full p-2.5 text-center text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-med-cyan transition-all"
                        >
                          🗣️ Tanyakan kapan bau logam aneh pertama kali tercium
                        </button>
                      )}

                      {interviewStep === "q1" && !interviewDone && (
                        <button 
                          onClick={() => setInterviewStep("q2")}
                          className="w-full p-2.5 text-center text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-med-cyan transition-all"
                        >
                          🗣️ Lanjut: Tanyakan kondisi warna air muara sungai utara
                        </button>
                      )}

                      {interviewStep === "q2" && !interviewDone && (
                        <button 
                          onClick={() => setInterviewStep("q3")}
                          className="w-full p-2.5 text-center text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-med-cyan transition-all"
                        >
                          🗣️ Lanjut: Tanyakan mengenai lesunya biota karang timur
                        </button>
                      )}

                      {interviewStep === "q3" && !interviewDone && (
                        <button 
                          onClick={() => setInterviewStep("thank")}
                          className="w-full p-2.5 text-center text-xs font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-med-cyan transition-all"
                        >
                          🗣️ Lanjut: Analisis Keterangan Pak Jono
                        </button>
                      )}

                      {interviewStep === "thank" && !interviewDone && (
                        <button 
                          onClick={handleFishermanAnswer}
                          className="w-full p-2.5 text-center text-xs font-bold bg-med-cyan hover:bg-med-cyan-dark text-white rounded-xl shadow-med-glow transition-all"
                        >
                          Simpan Kesaksian Nelayan Jono
                        </button>
                      )}

                      {(interviewStep === "thank" || interviewDone) && (
                        <button 
                          onClick={() => setActiveGame("map")}
                          className="w-full p-2.5 text-center text-xs font-bold bg-slate-800 hover:bg-slate-950 text-white rounded-xl transition-all"
                        >
                          Selesai &amp; Kembali ke Peta Lapangan
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

          </div>

          {/* Monolog Dokter Rad */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-4 md:p-6 flex items-start gap-4">
            <span className="text-3xl filter saturate-100">🦐</span>
            <div className="flex-grow space-y-1">
              <h4 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase font-mono">Monolog {characterName}</h4>
              <p className="text-sm italic text-slate-600 leading-relaxed">
                "{monologue}"
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Inventory Tracker */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
          className="lg:col-span-4 flex flex-col gap-6"
        >
          
          {/* Inventory checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col justify-between flex-grow min-h-[300px]">
            <div>
              <h3 className="text-md font-extrabold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                Tas Sampel &amp; Investigasi
              </h3>
              
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-150">
                  <span className="font-semibold text-slate-600">🧪 Sampel Air Muara</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inventory.water ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {inventory.water ? "TERSEDIA" : "KOSONG"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-150">
                  <span className="font-semibold text-slate-600">🕳️ Sedimen Lumpur</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inventory.sediment ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {inventory.sediment ? "TERSEDIA" : "KOSONG"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-150">
                  <span className="font-semibold text-slate-600">🦀 Cangkang Kepiting</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inventory.biota ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {inventory.biota ? "TERSEDIA" : "KOSONG"}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-150">
                  <span className="font-semibold text-slate-600">⛵ Bukti Saksi Jono</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${interviewDone ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"}`}>
                    {interviewDone ? "TERCATAT" : "KOSONG"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100">
              {isAllCollected && interviewDone ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/lab")}
                  className="w-full py-3.5 bg-med-teal hover:bg-med-teal-dark text-white font-bold rounded-2xl text-sm shadow-teal-glow transition-all flex items-center justify-center gap-2"
                >
                  Bawa Semua Bukti ke Lab &rarr;
                </motion.button>
              ) : (
                <div className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-2xl text-xs flex flex-col items-center justify-center gap-1">
                  <span>KUMPULKAN SEMUA TUGAS</span>
                  <span className="text-[10px] font-normal text-slate-400">
                    ({[inventory.water, inventory.sediment, inventory.biota, interviewDone].filter(Boolean).length}/4 Selesai)
                  </span>
                </div>
              )}
            </div>

          </div>
          
        </motion.div>

      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 Kementrian Kelautan dan Keamanan Pangan - Proyek Edukasi Fisika Radiasi OPSI</p>
      </footer>

    </main>
  );
}

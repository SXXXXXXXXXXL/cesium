"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Beaker, 
  Map, 
  Building, 
  Trophy, 
  Zap, 
  Compass, 
  Anchor,
  HelpCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { api } from "../../lib/api";

const HubMapComponent = dynamic(() => import("../../components/HubMapComponent"), { ssr: false });

export default function HubPage() {
  const [activeHover, setActiveHover] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [samplesCount, setSamplesCount] = useState(0);
  const [progress, setProgress] = useState({
    score: 0,
    xp: 0,
    currentModule: 1,
    currentPanel: 1,
    fishermanInterviewed: false,
    activityCalculated: false,
    decaySolved: false,
    timelineSolved: false,
    laporanExported: false,
  });
  const [characterName, setCharacterName] = useState("Dokter Rad");
  const [dialogueList, setDialogueList] = useState<string[]>([]);

  useEffect(() => {
    setDialogueList([
      `Halo, Inspektur! Saya ${characterName}, Kepala Food Safety Inspector. Senang Anda sudah bergabung di Pelabuhan Utama Teluk Biru.`,
      "Laporan nelayan setempat menyebutkan ikan-ikan di area timur terasa aneh dan terdapat pencemaran misterius. Diduga kuat berasal dari kebocoran zat radioaktif Cesium-137.",
      "Misi utama Anda: 1. Terima berkas di Kantor. 2. Ambil sampel air, sedimen, dan biota di Peta Laut. 3. Analisis kadar radiasinya di Laboratorium. Semoga sukses!"
    ]);
  }, [characterName]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const p = await api.getProgress();
        setProgress(p);

        const char = p.selectedCharacter || localStorage.getItem("cesium_character");
        if (char) {
          setCharacterName(char);
        }

        const s = await api.getSamples();
        setSamplesCount(s.length);
      } catch (err) {
        console.error("Failed to load hub data:", err);
      }
    };
    loadData();
  }, []);

  // spring physics config
  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      
      {/* 1. Header Bar with Tactile Stats */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springTransition}
        className="w-full bg-white border-b border-slate-200 py-3 px-6 sticky top-0 z-40 shadow-sm"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-med-cyan flex items-center justify-center text-white shadow-med-glow animate-pulse">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                READ SEA <span className="text-med-cyan font-mono text-lg font-bold px-1.5 py-0.5 bg-med-cyan-light rounded border border-med-cyan/20">Cs-137</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">OPSI 2026 Educational Simulator</p>
            </div>
          </div>

          {/* Tactile Scoreboards */}
          <div className="flex items-center gap-3 font-mono text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-med-cyan-light border border-med-cyan/20 rounded-xl text-med-cyan-dark shadow-sm">
              <Zap className="w-4 h-4 text-med-cyan" />
              <span className="font-bold">XP:</span>
              <span className="font-extrabold">{progress.xp}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 shadow-sm">
              <Trophy className="w-4 h-4 text-emerald-500" />
              <span className="font-bold">SKOR:</span>
              <span className="font-extrabold">{progress.score}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 shadow-sm">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span className="font-bold">STATUS:</span>
              <span className="font-extrabold text-xs">
                {progress.timelineSolved ? "TERATASI" : progress.activityCalculated ? "KRISIS" : "SIAGA 1"}
              </span>
            </div>
          </div>

        </div>
      </motion.header>

      {/* 2. Main Space Container */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Interactive 2D Map Canvas (7 cols) */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
          className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col gap-4 overflow-hidden relative group"
        >
          {/* Header Card inside Area */}
          <div className="flex justify-between items-center mb-1 z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Compass className="w-5 h-5 text-med-teal" /> 
                Peta Hub Pelabuhan Utama
              </h2>
              <p className="text-xs text-slate-500">Klik langsung area pada peta untuk bepergian</p>
            </div>
            <button 
              onClick={() => setShowTutorial(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Map Visual (Fictional 2D Map) */}
          <div className="relative flex-grow flex flex-col min-h-[400px] h-full w-full">
            <HubMapComponent
              setActiveHover={setActiveHover}
              characterName={characterName}
            />
            
            {/* Hover Tooltip Overlay */}
            <AnimatePresence>
              {activeHover && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-4 left-4 right-4 bg-white/95 border border-med-cyan/30 rounded-xl px-4 py-2.5 shadow-med-glow z-20 flex justify-between items-center"
                >
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    {activeHover === "kantor" && <>🏢 <strong>Kantor Pusat:</strong> Dapatkan berkas investigasi pertama dan petunjuk dari {characterName}.</>}
                    {activeHover === "lab" && <>🔬 <strong>Laboratorium Radiologi:</strong> Ukur sampel dengan gamma spektrometer dan hitung rumusnya.</>}
                    {activeHover === "peta" && <>⛵ <strong>Misi Sampling Laut:</strong> Temukan nelayan dan kumpulkan sampel biota/sedimen air.</>}
                  </span>
                  <span className="text-xs text-med-cyan font-mono font-bold">KLIK UNTUK MASUK &rarr;</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick status bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Koordinat Pelabuhan: <span className="font-mono">106.8456° E, -6.1751° S</span></span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
              Koneksi Server Stabil
            </span>
          </div>

        </motion.div>

        {/* Right Column: Mission Control & Dialogues (5 cols) */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          
          {/* Mission & Briefing Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-med-orange-light text-med-orange border border-med-orange/20 uppercase">
                Misi Utama
              </span>
              <h2 className="text-xl font-extrabold text-slate-800 mt-1">Investigasi Teluk Biru</h2>
            </div>
            <div className="space-y-3">

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start gap-3">
                <input type="checkbox" readOnly checked={progress.fishermanInterviewed} className="mt-1 accent-med-teal rounded cursor-default" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Lapor ke Kantor Misi</h4>
                  <p className="text-xs text-slate-500">Kumpulkan berkas laporan awal dan wawancarai nelayan.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start gap-3">
                <input type="checkbox" readOnly checked={samplesCount >= 3} className="mt-1 accent-med-teal rounded cursor-default" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Kumpulkan 3 Sampel Laut ({samplesCount}/3)</h4>
                  <p className="text-xs text-slate-500">Gunakan kapal untuk mengambil sampel air, sedimen, dan biota.</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-start gap-3">
                <input type="checkbox" readOnly checked={progress.activityCalculated} className="mt-1 accent-med-teal rounded cursor-default" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">Uji Gamma Spektrometer</h4>
                  <p className="text-xs text-slate-500">Bawa sampel ke Lab untuk menghitung aktivitas Cs-137.</p>
                </div>
              </div>
            </div>

            <div className="bg-med-cyan-light rounded-2xl border border-med-cyan/20 p-4 mt-2">

              <div className="flex gap-2.5">
                <ShieldAlert className="w-5 h-5 text-med-cyan shrink-0 mt-0.5" />
                <div>
                  <h5 className="text-xs font-bold uppercase text-med-cyan-dark font-mono">Petunjuk Laboratorium</h5>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    Cs-137 memancarkan radiasi gamma pada energi <strong>662 keV</strong>. Simpan angka ini untuk kalibrasi spektrometer nanti!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Dialogue Box featuring "Dokter Rad" with Slide-in Material */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col justify-between flex-grow min-h-[280px] relative overflow-hidden">
            
            {/* Character Slide Overlay */}
            <div className="absolute right-4 bottom-0 w-36 h-40 bg-contain bg-no-repeat bg-bottom opacity-15 pointer-events-none group-hover:scale-105 transition-transform" 
                 style={{ 
                   backgroundImage: characterName === "Dokter Cesi"
                     ? "url('https://images.unsplash.com/photo-1534080391025-097b03b74764?auto=format&fit=crop&q=80&w=300')"
                     : "url('https://images.unsplash.com/photo-1559737558-2f5a35f4520b?auto=format&fit=crop&q=80&w=300')"
                 }}
            />

            <div className="z-10">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-med-cyan/10 flex items-center justify-center text-med-cyan-dark">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">{characterName}</h3>
                    <p className="text-[10px] text-med-cyan font-semibold font-mono tracking-wider">FOOD SAFETY INSPECTOR</p>
                  </div>
                </div>
                
                <span className="text-xs font-mono font-bold text-slate-400">
                  {dialogueIndex + 1} / {dialogueList.length}
                </span>
              </div>

              {/* Dialogue Bubble */}
              <div className="relative min-h-[100px]">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={dialogueIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-600 text-sm leading-relaxed"
                  >
                    "{dialogueList[dialogueIndex]}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Dialogue Controls with Framer Motion Spring Pressures */}
            <div className="flex justify-between items-center gap-3 mt-4 pt-3 border-t border-slate-100 z-10">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDialogueIndex(prev => Math.max(0, prev - 1))}
                disabled={dialogueIndex === 0}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Kembali
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (dialogueIndex < dialogueList.length - 1) {
                    setDialogueIndex(prev => prev + 1);
                  } else {
                    setDialogueIndex(0); // loop
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-med-cyan text-white text-xs font-bold rounded-xl shadow-med-glow hover:bg-med-cyan-dark transition-colors"
              >
                {dialogueIndex === dialogueList.length - 1 ? "Ulangi" : "Lanjut"}
                <ArrowRight className="w-3 h-3" />
              </motion.button>
            </div>

          </div>
          
        </motion.div>

      </div>

      {/* 3. Footer Bar */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 Kementrian Kelautan dan Keamanan Pangan - Proyek Edukasi Fisika Radiasi OPSI</p>
      </footer>

      {/* 4. Tutorial Modal (Bouncy Spring Overlay) */}
      <AnimatePresence>
        {showTutorial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTutorial(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={springTransition}
              className="w-full max-w-md bg-white border border-med-cyan/30 rounded-3xl p-6 shadow-med-glow-lg z-10 relative overflow-hidden"
            >
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Panduan Simulasi</h3>
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  Selamat datang di simulator <strong>READ SEA CESIUM-137</strong>! Game ini dirancang menggunakan sistem petunjuk interaktif (Escape Room style).
                </p>
                <ul className="list-disc list-inside space-y-1.5 text-xs">
                  <li><strong>Peta Hub:</strong> Klik hotspots (Kantor, Lab, Peta Laut) untuk navigasi cepat.</li>
                  <li><strong>Investigasi:</strong> Kumpulkan sampel di laut, lalu ukur kadar radioaktivitasnya.</li>
                  <li><strong>Laporan:</strong> Susun kronologi kejadian dan ekspor PDF sebagai laporan akhir investigasi Anda!</li>
                </ul>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTutorial(false)}
                className="w-full mt-6 py-2.5 bg-med-cyan hover:bg-med-cyan-dark text-white font-bold rounded-xl text-sm shadow-med-glow transition-all"
              >
                Saya Mengerti!
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </main>
  );
}

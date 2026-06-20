"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building, 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  ShieldAlert,
  Anchor,
  User,
  CheckCircle2
} from "lucide-react";
import { api } from "../../lib/api";

export default function KantorPage() {
  const router = useRouter();
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [characterName, setCharacterName] = useState("Dokter Rad");
  const [dialogueList, setDialogueList] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const char = localStorage.getItem("cesium_character");
      if (char) {
        setCharacterName(char);
      }
    }
  }, []);

  useEffect(() => {
    setDialogueList([
      `Selamat datang di Kantor Pusat Food Safety Inspector. Saya ${characterName}. Laporan awal dari Pelabuhan Teluk Biru baru saja masuk pagi ini.`,
      "Nelayan di Sektor Timur mendapati ikan tangkapan mereka berbau logam aneh. Terlebih lagi, biota di sekitar terumbu karang tampak lesu dan mati dalam jumlah yang tidak wajar.",
      "Berdasarkan koordinat yang dilaporkan, kami mencurigai adanya kebocoran limbah dari fasilitas industri di utara yang membawa unsur Cesium-137.",
      "Tugas pertama Anda: Bawa berkas investigasi ini, pergi ke dermaga, lalu sewa kapal untuk mengambil tiga jenis sampel: Air, Sedimen Dasar Laut, dan Biota (Kepiting/Kerang).",
      "Gunakan tab-alat di lapangan untuk mendeteksi paparan radiasi awal. Setelah itu, bawa semua sampel kembali ke laboratorium radiasi."
    ]);
  }, [characterName]);

  useEffect(() => {
    // Check if mission is already accepted
    const checkProgress = async () => {
      try {
        const p = await api.getProgress();
        if (p.currentModule >= 2) {
          setAccepted(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkProgress();
  }, []);

  const handleAcceptMission = async () => {
    setLoading(true);
    try {
      // Update progress to mark that the briefing/first step is done
      await api.updateProgress({ 
        currentModule: 2,
        score: 50,
        xp: 100
      });
      setAccepted(true);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
      // Fallback
      setAccepted(true);
    }
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      
      {/* Header Bar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springTransition}
        className="w-full bg-white border-b border-slate-200 py-4 px-6 z-40 shadow-sm"
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-med-cyan flex items-center justify-center text-white shadow-med-glow">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">Kantor Inspektur</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Module 1: Briefing Misi</p>
            </div>
          </div>
          <button 
            onClick={() => router.push("/hub")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Hub
          </button>
        </div>
      </motion.header>

      {/* Content Workspace */}
      <div className="flex-grow max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Official Mission Document File Card (7 cols) */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
          className="md:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 md:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-6">
              <FileText className="w-6 h-6 text-med-cyan" />
              <div>
                <h3 className="text-md font-extrabold text-slate-800">BERKAS TUGAS #137-A</h3>
                <p className="text-[10px] text-slate-400 font-mono">KLASIFIKASI: RAHASIA / KEAMANAN PANGAN</p>
              </div>
            </div>

            {/* Document layout representation */}
            <div className="space-y-4 text-sm leading-relaxed text-slate-600">
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
                <span className="text-[10px] font-bold text-med-orange uppercase font-mono tracking-widest block mb-1">Target Kasus</span>
                <p className="font-semibold text-slate-800">Kontaminasi Isotop Cs-137 di Sektor Teluk Biru.</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-700 font-sans">Informasi Zat Cesium-137:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-500 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                  <li><strong>Tipe Radiasi:</strong> Beta-minus dan Gamma (662 keV).</li>
                  <li><strong>Waktu Paruh (Half-life):</strong> 30,17 Tahun (Sangat persisten di ekosistem).</li>
                  <li><strong>Risiko Pangan:</strong> Terakumulasi di sedimen dasar laut dan diserap oleh biota laut (ikan, udang, kepiting), dapat merusak sel DNA jika dikonsumsi manusia.</li>
                </ul>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-700">Daftar Kebutuhan Peralatan Lapangan:</span>
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono">
                  <div className="p-2 border border-slate-150 rounded-lg flex items-center gap-1.5">
                    <span className="text-med-cyan">✓</span> Gamma Scanner (cps)
                  </div>
                  <div className="p-2 border border-slate-150 rounded-lg flex items-center gap-1.5">
                    <span className="text-med-cyan">✓</span> Water Grab Sampler
                  </div>
                  <div className="p-2 border border-slate-150 rounded-lg flex items-center gap-1.5">
                    <span className="text-med-cyan">✓</span> Sediment Sampler Core
                  </div>
                  <div className="p-2 border border-slate-150 rounded-lg flex items-center gap-1.5">
                    <span className="text-med-cyan">✓</span> Kantong Sampel Biota
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
            <span>Dikeluarkan oleh: Badan Pengawas Radiasi Laut</span>
            <span>Juni 2026</span>
          </div>

        </motion.div>

        {/* Right Column: Dialogue Box and Interactive Action Button (5 cols) */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={springTransition}
          className="md:col-span-5 flex flex-col justify-between bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 relative overflow-hidden"
        >
          {/* Background image container for character */}
          <div 
            className="absolute right-4 bottom-0 w-36 h-40 bg-contain bg-no-repeat bg-bottom opacity-10 pointer-events-none" 
            style={{
              backgroundImage: characterName === "Dokter Cesi"
                ? "url('https://images.unsplash.com/photo-1534080391025-097b03b74764?auto=format&fit=crop&q=80&w=300')"
                : "url('https://images.unsplash.com/photo-1559737558-2f5a35f4520b?auto=format&fit=crop&q=80&w=300')"
            }}
          />

          <div className="z-10 w-full">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-med-cyan/10 flex items-center justify-center text-med-cyan-dark">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">{characterName}</h3>
                <p className="text-[9px] text-med-cyan font-semibold font-mono tracking-wider">FOOD SAFETY INSPECTOR</p>
              </div>
            </div>

            <div className="relative min-h-[140px] text-sm leading-relaxed text-slate-600">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={dialogueIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                >
                  "{dialogueList[dialogueIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Slider dialog controls */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs font-mono font-bold text-slate-400">
                {dialogueIndex + 1} / {dialogueList.length}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDialogueIndex(prev => Math.max(0, prev - 1))}
                  disabled={dialogueIndex === 0}
                  className="p-1 px-3.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={() => {
                    if (dialogueIndex < dialogueList.length - 1) {
                      setDialogueIndex(prev => prev + 1);
                    }
                  }}
                  disabled={dialogueIndex === dialogueList.length - 1}
                  className="p-1 px-3.5 rounded-lg bg-med-cyan text-white text-xs font-bold hover:bg-med-cyan-dark disabled:opacity-50 transition-colors"
                >
                  Lanjut
                </button>
              </div>
            </div>
          </div>

          {/* Action Trigger accepting the mission (bouncy button) */}
          <div className="mt-8 pt-4 border-t border-slate-100 z-10">
            {accepted ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-medium">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  Misi Investigasi Teluk Biru Telah Diterima!
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/fieldwork")}
                  className="w-full py-3.5 bg-med-teal hover:bg-med-teal-dark text-white font-bold rounded-2xl text-sm shadow-teal-glow transition-all flex items-center justify-center gap-2"
                >
                  <Anchor className="w-4 h-4" /> Pergi ke Teluk Biru (Dermaga)
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                onClick={handleAcceptMission}
                className="w-full py-3.5 bg-med-orange hover:bg-med-orange-dark text-white font-bold rounded-2xl text-sm shadow-orange-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShieldAlert className="w-4 h-4 animate-bounce" />
                {loading ? "Menandatangani Berkas..." : "TERIMA MISI & MULAI"}
              </motion.button>
            )}
          </div>

        </motion.div>

      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400">
        <p>© 2026 Kementrian Kelautan dan Keamanan Pangan - Proyek Edukasi Fisika Radiasi OPSI</p>
      </footer>

    </main>
  );
}

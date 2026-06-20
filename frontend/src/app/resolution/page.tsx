"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  ArrowLeft, 
  Clock, 
  FileCheck, 
  Printer, 
  Award, 
  Sparkles,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Trophy,
  Zap,
  BookmarkCheck
} from "lucide-react";
import { api } from "../../lib/api";

interface ClueCard {
  id: string;
  title: string;
  desc: string;
  dayText: string;
  correctIndex: number;
}

interface SampleItem {
  id: string;
  type: string;
  location: string;
  activity?: number;
}

export default function ResolutionPage() {
  const router = useRouter();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(23 * 3600 + 45 * 65);
  
  // Chronology Puzzle state
  const initialCards: ClueCard[] = [
    { id: "biota", title: "Biota Terkontaminasi", desc: "Kepiting dasar laut menyerap Cs-137 dari rantai makanan.", dayText: "Hari -3", correctIndex: 2 },
    { id: "discharge", title: "Pembuangan Limbah", desc: "Tangki pabrik industri bocor melepas isotop radioaktif.", dayText: "Hari -10", correctIndex: 0 },
    { id: "current", title: "Penyebaran Arus", desc: "Arus laut utara menyebarkan Cs-137 ke terumbu karang.", dayText: "Hari -7", correctIndex: 1 },
    { id: "caught", title: "Ikan Terkapar & Ditangkap", desc: "Ikan tangkapan nelayan berbau logam dan lesu.", dayText: "Hari 0", correctIndex: 3 },
  ];

  const [timelineOrder, setTimelineOrder] = useState<(string | null)[]>([null, null, null, null]);
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [puzzleError, setPuzzleError] = useState("");
  const [showVictory, setShowVictory] = useState(false);
  
  // Report Stats state
  const [username, setUsername] = useState("INSPEKTUR");
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [progress, setProgress] = useState({ score: 0, xp: 0 });
  const [monologue, setMonologue] = useState("Saya harus merekonstruksi kronologi rantai pencemaran dari berkas nelayan dan uji lab agar bukti kebocoran limbah ini menjadi sah.");
  const [characterName, setCharacterName] = useState("Dokter Rad");

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const loadReportData = async () => {
      try {
        const u = localStorage.getItem("cesium_username") || "Guest Inspector";
        setUsername(u);

        const char = localStorage.getItem("cesium_character");
        if (char) {
          setCharacterName(char);
        }

        const s = await api.getSamples();
        setSamples(s);

        const p = await api.getProgress();
        setProgress(p);
        setPuzzleSolved(p.timelineSolved);
        if (p.timelineSolved) {
          setShowVictory(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadReportData();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAssignToSlot = (cardId: string, slotIndex: number) => {
    setTimelineOrder(prev => {
      const next = [...prev];
      const currentIdx = next.indexOf(cardId);
      if (currentIdx !== -1) {
        next[currentIdx] = null;
      }
      next[slotIndex] = cardId;
      return next;
    });
  };

  const handleVerifyTimeline = async () => {
    const isCorrect = 
      timelineOrder[0] === "discharge" &&
      timelineOrder[1] === "current" &&
      timelineOrder[2] === "biota" &&
      timelineOrder[3] === "caught";

    if (isCorrect) {
      setPuzzleSolved(true);
      setPuzzleError("");
      setMonologue("Bagus! Rantai kronologis kejadian terbukti. Laporan krisis dapat segera dicetak.");
      try {
        const p = await api.getProgress();
        const updated = await api.updateProgress({
          timelineSolved: true,
          score: p.score + 100, // victory bonus
          xp: p.xp + 200
        });
        setProgress(updated.progress);
        setShowVictory(true);
      } catch (e) {
        console.error(e);
        setShowVictory(true);
      }
    } else {
      setPuzzleError("Urutan kronologi salah! Saya harus memeriksa ulang korelasi tanggal hari kejadian.");
    }
  };

  const handlePrint = async () => {
    try {
      const p = await api.getProgress();
      await api.updateProgress({
        laporanExported: true,
        score: p.score + 50,
        xp: p.xp + 50
      });
    } catch (e) {
      console.error(e);
    }
    window.print();
  };

  const handleRestartGame = () => {
    localStorage.removeItem("cesium_token");
    localStorage.removeItem("cesium_username");
    router.push("/");
  };

  const getSampleActivity = (type: string) => {
    const match = samples.find(s => s.type === type);
    return match && match.activity ? `${match.activity} Bq/kg` : "Menunggu Uji Lab";
  };

  const isDangerLimit = (type: string) => {
    const match = samples.find(s => s.type === type);
    return match && match.activity ? match.activity > 100 : false;
  };

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  return (
    <main className="flex flex-col min-h-screen bg-slate-50 text-slate-800 selection:bg-med-cyan/30 print:bg-white print:text-black">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={springTransition}
        className="w-full bg-white border-b border-slate-200 py-3 px-6 z-40 shadow-sm print:hidden"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-med-orange flex items-center justify-center text-white shadow-orange-glow">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-slate-800 font-sans">{characterName}: Resolusi Kasus</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Lokasi: Ruang Penanganan Krisis</p>
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

      {/* Main Workspace */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Chronology Card Puzzle & Monologue (7 cols) - Hidden in Print */}
        <div className="lg:col-span-7 flex flex-col gap-6 print:hidden">
          
          {/* Countdown timer */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springTransition}
            className="bg-slate-900 rounded-3xl p-6 text-white border border-slate-800 shadow-orange-glow flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-widest flex items-center gap-1 w-fit">
                <AlertOctagon className="w-3 h-3 animate-ping" /> KRISIS DARURAT CS-137
              </span>
              <h3 className="text-lg font-bold font-sans">Batas Akhir Pelaporan</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Saya harus memetakan rantai penyebaran limbah sebelum rilis media pers pagi.</p>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-950/80 px-4 py-3 border border-slate-800 rounded-2xl">
              <Clock className="w-5 h-5 text-red-500 animate-pulse" />
              <div className="font-mono text-center">
                <div className="text-lg font-extrabold tracking-widest text-red-400">{formatTime(timeLeft)}</div>
                <div className="text-[8px] text-slate-500 uppercase font-bold">SISA WAKTU</div>
              </div>
            </div>
          </motion.div>

          {/* Timeline Card puzzle */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={springTransition}
            className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-med-cyan" /> 
                Rantai Kronologi Pencemaran Teluk
              </h3>
              <p className="text-xs text-slate-500">Tentukan urutan kronologi hari pembuangan zat radioaktif Cs-137</p>
            </div>

            {/* Slots */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6 text-center">
              {[0, 1, 2, 3].map((slotIdx) => {
                const assignedCardId = timelineOrder[slotIdx];
                const card = assignedCardId ? initialCards.find(c => c.id === assignedCardId) : null;
                const slotDays = ["Hari -10", "Hari -7", "Hari -3", "Hari 0"];

                return (
                  <div key={slotIdx} className="border-2 border-dashed border-slate-200 rounded-2xl p-3 bg-slate-50 min-h-[140px] flex flex-col justify-between">
                    <span className="text-[10px] font-bold font-mono text-slate-400 block mb-2">{slotDays[slotIdx]}</span>
                    
                    {card ? (
                      <motion.div 
                        layoutId={card.id}
                        className="p-2.5 bg-white border border-slate-150 rounded-xl text-left shadow-sm flex-grow flex flex-col justify-between"
                      >
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{card.title}</h4>
                        <button 
                          onClick={() => {
                            setTimelineOrder(prev => {
                              const next = [...prev];
                              next[slotIdx] = null;
                              return next;
                            });
                          }}
                          className="text-[9px] text-red-500 font-bold mt-2 hover:underline"
                        >
                          HAPUS
                        </button>
                      </motion.div>
                    ) : (
                      <div className="flex-grow flex items-center justify-center text-xs text-slate-400 font-mono">
                        Kosong
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Clues */}
            {!puzzleSolved && (
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500 block">Daftar Bukti Kejadian:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {initialCards.map((c) => {
                    const isAssigned = timelineOrder.includes(c.id);
                    if (isAssigned) return null;

                    return (
                      <div key={c.id} className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all flex justify-between items-center gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{c.title}</h4>
                          <p className="text-[10px] text-slate-500 leading-normal mt-0.5">{c.desc}</p>
                        </div>
                        
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((slotIdx) => (
                            <button
                              key={slotIdx}
                              onClick={() => handleAssignToSlot(c.id, slotIdx)}
                              className="w-5 h-5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold hover:bg-med-cyan hover:text-white hover:border-med-cyan"
                            >
                              {slotIdx + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Verification trigger */}
            {puzzleSolved ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2.5 mt-4 text-xs font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Bukti rantai kejadian telah terverifikasi sah di database investigasi.
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3">
                {puzzleError && <p className="text-red-500 text-xs font-bold font-mono">⚠️ {puzzleError}</p>}
                <button
                  onClick={handleVerifyTimeline}
                  className="w-full md:w-auto px-6 py-2.5 bg-med-cyan text-white text-xs font-bold rounded-xl shadow-med-glow hover:bg-med-cyan-dark ml-auto"
                >
                  Verifikasi Kronologi
                </button>
              </div>
            )}

          </motion.div>

          {/* Dokter Rad Thought Monologue */}
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

        {/* Right Column: Laporan Krisis Official Report & Victory overlay */}
        <div className="lg:col-span-5 flex flex-col gap-6 print:col-span-12">
          
          {/* Scientific report card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 md:p-8 flex flex-col gap-6 print:border-none print:shadow-none">
            
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono bg-slate-900 text-white uppercase tracking-widest block w-fit">
                  Laporan Resmi FSI
                </span>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight font-sans print:text-2xl">
                  LAPORAN KRISIS CS-137
                </h2>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Uji: 7 Juni 2026
                </div>
              </div>
              <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 text-xl font-bold font-mono">
                Cs
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono border-b border-slate-100 pb-5">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Inspektur Penguji</span>
                <span className="font-bold text-slate-800 text-sm uppercase">{username}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase font-bold">Status Keamanan</span>
                <span className="font-bold text-red-500 text-sm uppercase">PENCEMARAN TERJADI</span>
              </div>
            </div>

            {/* Spectrometer readings */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 font-sans block">Pembacaan Aktivitas Isotop:</span>
              
              <div className="border border-slate-150 rounded-2xl overflow-hidden text-xs font-mono">
                <div className="grid grid-cols-3 bg-slate-50 border-b border-slate-150 p-2.5 font-bold text-slate-500 text-[10px]">
                  <span>Sampel</span>
                  <span>Lokasi</span>
                  <span className="text-right">Aktivitas Cs-137</span>
                </div>
                
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold">🧪 Sampel Air</span>
                    <span className="text-slate-500 text-[10px]">Muara Utara</span>
                    <span className="text-right font-bold text-slate-700">{getSampleActivity("water")}</span>
                  </div>

                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold">🕳️ Sampel Lumpur</span>
                    <span className="text-slate-500 text-[10px]">Palung Tengah</span>
                    <span className="text-right font-bold text-slate-700">{getSampleActivity("sediment")}</span>
                  </div>

                  <div className="grid grid-cols-3 p-2.5 items-center">
                    <span className="font-semibold flex items-center gap-1">
                      🦀 Cangkang Kepiting
                      {isDangerLimit("biota") && <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block animate-ping" />}
                    </span>
                    <span className="text-slate-500 text-[10px]">Karang Timur</span>
                    <span className={`text-right font-bold ${isDangerLimit("biota") ? "text-red-500 font-extrabold" : "text-slate-700"}`}>
                      {getSampleActivity("biota")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Safety limits notes */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-xs leading-relaxed text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Threshold Batas Konsumsi:</span>
              Batas aman legal Cs-137 pangan laut adalah <strong>100 Bq/kg</strong>. 
              {isDangerLimit("biota") ? (
                <p className="text-red-500 font-bold mt-2 font-mono text-[10px]">
                  ⚠️ PERINGATAN: Nilai aktivitas kepiting di Karang Timur melebihi batas aman pangan!
                </p>
              ) : (
                <p className="text-slate-500 font-medium mt-2">
                  (Sampel Biota dalam data belum melebihi threshold).
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs text-slate-600 pt-4 border-t border-slate-100 leading-relaxed">
              <span className="font-bold text-slate-800">Rekomendasi Penutupan Sementara:</span>
              <p className="italic bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-[11px]">
                "Inspeksi membuktikan adanya korelasi kebocoran limbah pabrik utara pada Hari -10 dengan kontaminasi biota kepiting di Karang Timur. Direkomendasikan penutupan karang timur untuk nelayan lokal."
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* MISSION COMPLETE Celebratory Victory Overlay */}
      <AnimatePresence>
        {showVictory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
            
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />

            {/* Victory Card */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={springTransition}
              className="w-full max-w-lg bg-white border border-med-cyan/30 rounded-3xl p-6 md:p-8 shadow-med-glow-lg z-10 relative overflow-hidden text-center"
            >
              
              {/* Confetti Visual decoration using floating CSS elements */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-med-cyan via-amber-400 to-med-teal animate-pulse" />
              
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 mx-auto mb-4 animate-bounce">
                <Trophy className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-800">MISI SELESAI &amp; BERHASIL!</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Inspeksi Keamanan Pangan Teluk Biru</p>
              
              <div className="my-6 p-4 bg-slate-50 border border-slate-150 rounded-2xl text-left space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 leading-normal">
                  <BookmarkCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span>Saya berhasil melacak rantai kontaminasi limbah radioaktif Cs-137. Teluk Biru kini berada di bawah pengawasan ketat dan aman untuk warga.</span>
                </div>
                
                {/* Stats summary */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 text-center font-mono">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold flex justify-center items-center gap-0.5"><Zap className="w-3 h-3 text-med-cyan" /> TOTAL XP</div>
                    <div className="text-base font-extrabold text-slate-800">{progress.xp}</div>
                  </div>
                  <div className="text-center p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-bold flex justify-center items-center gap-0.5"><Trophy className="w-3 h-3 text-emerald-500" /> SKOR AKHIR</div>
                    <div className="text-base font-extrabold text-slate-800">{progress.score}</div>
                  </div>
                </div>
              </div>

              {/* Badges unlocked */}
              <div className="space-y-2 mb-6 text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Badge Penghargaan Diterima:</span>
                <div className="flex gap-2 justify-center">
                  <span className="px-2.5 py-1.5 bg-sky-50 border border-sky-100 rounded-xl text-xs font-bold text-sky-700 flex items-center gap-1">🎖️ Pelabuhan</span>
                  <span className="px-2.5 py-1.5 bg-teal-50 border border-teal-100 rounded-xl text-xs font-bold text-teal-700 flex items-center gap-1">🎖️ Nuklir</span>
                  <span className="px-2.5 py-1.5 bg-amber-50 border border-amber-100 rounded-xl text-xs font-bold text-amber-700 flex items-center gap-1">🎖️ Pahlawan</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={handlePrint}
                  className="py-3.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" /> Unduh Laporan PDF
                </button>
                <button
                  onClick={handleRestartGame}
                  className="py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Main Ulang Game
                </button>
              </div>

              <button 
                onClick={() => setShowVictory(false)}
                className="text-xs text-slate-400 font-semibold hover:underline block mx-auto mt-4"
              >
                Lihat Lembar Laporan
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 print:hidden mt-auto">
        <p>© 2026 Kementrian Kelautan dan Keamanan Pangan - Proyek Edukasi Fisika Radiasi OPSI</p>
      </footer>

    </main>
  );
}

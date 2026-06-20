"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Sparkles, UserCheck, Beaker, HelpCircle, ArrowRight } from "lucide-react";

import { api } from "../lib/api";

export default function WelcomePage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "role">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedChar, setSelectedChar] = useState<"Dokter Rad" | "Dokter Cesi">("Dokter Rad");

  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Masukkan Nama Inspektur Anda!");
      return;
    }
    try {
      setError("");
      await api.register(username, password || undefined);
      setStep("role");
    } catch (err: any) {
      setError(err.message || "Gagal membuat ID!");
    }
  };

  const handleSelectRole = async () => {
    try {
      await api.updateProgress({ selectedCharacter: selectedChar });
      if (typeof window !== "undefined") {
        localStorage.setItem("cesium_character", selectedChar);
      }
      router.push("/hub");
    } catch (e) {
      console.error(e);
      if (typeof window !== "undefined") {
        localStorage.setItem("cesium_character", selectedChar);
      }
      router.push("/hub");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 md:p-6 overflow-hidden relative selection:bg-med-cyan/30">
      
      {/* Subtle background element */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-med-cyan/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-med-teal/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Floating Header */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800">
          READ SEA <span className="text-med-cyan font-mono px-2 py-0.5 bg-med-cyan-light rounded-xl border border-med-cyan/20">Cs-137</span>
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-2">
          Simulator Keamanan Pangan & Deteksi Radiasi
        </p>
      </div>

      <div className="w-full max-w-lg z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: INTERACTIVE BADGE LOGIN */}
          {step === "login" && (
            <motion.div
              key="login"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={springTransition}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-med-glow relative overflow-hidden"
            >
              {/* Badge visual element */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-med-cyan to-med-teal" />
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-med-cyan/15 flex items-center justify-center text-med-cyan-dark">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">E-ID Kredensial</h3>
                  <p className="text-xs text-slate-400">Masuk sebagai Inspector Food Safety</p>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                    ID / Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan nama Anda..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-med-cyan transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                    Sandi Akses (Opsional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm focus:outline-none focus:border-med-cyan transition-colors"
                  />
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-xs font-bold text-red-500 font-mono"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3.5 bg-med-cyan hover:bg-med-cyan-dark text-white font-bold rounded-xl text-sm shadow-med-glow transition-all flex items-center justify-center gap-2 mt-2"
                >
                  Buat ID Inspector
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-400">
                  Kemampuan Kognitif: Direkomendasikan untuk Siswa SMP (12-15 tahun)
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CHARACTER & ROLE SELECTION */}
          {step === "role" && (
            <motion.div
              key="role"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={springTransition}
              className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-med-glow relative overflow-hidden max-w-2xl mx-auto"
            >
              {/* Badge visual header */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-med-teal to-med-cyan" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Verifikasi Role</h3>
                  <p className="text-xs text-slate-400">Pilih karakter Inspektur Anda untuk memulai simulasi</p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-1 bg-med-teal-light text-med-teal rounded-lg border border-med-teal/20">
                  ID: {username.toUpperCase()}
                </span>
              </div>

              {/* Side-by-side selection cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                
                {/* Character Profile Card (Dokter Rad) */}
                <div 
                  onClick={() => setSelectedChar("Dokter Rad")}
                  className={`cursor-pointer border-2 rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col items-center gap-3 text-center ${selectedChar === "Dokter Rad" ? "border-med-cyan bg-sky-50/20 shadow-md scale-102" : "border-slate-200 bg-white hover:border-slate-350"}`}
                >
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-med-cyan bg-slate-100 overflow-hidden flex items-center justify-center relative shadow-sm"
                    style={{ 
                      backgroundImage: "url('https://images.unsplash.com/photo-1559737558-2f5a35f4520b?auto=format&fit=crop&q=80&w=200')",
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <div className="absolute inset-0 bg-med-cyan/10" />
                    <span className="absolute bottom-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-med-cyan text-white tracking-widest font-mono">
                      RAD
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1">
                      Dokter Rad {selectedChar === "Dokter Rad" && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </h4>
                    <p className="text-[10px] text-med-cyan-dark font-semibold font-mono uppercase tracking-wider">
                      Udang Jantan (Field Expert)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed h-12 overflow-hidden">
                      Fokus pada instrumentasi radiasi lapangan, instrumen Geiger, dan pemetaan sebaran limbah.
                    </p>
                  </div>
                  
                  {/* Rad Stats */}
                  <div className="w-full grid grid-cols-3 gap-1 font-mono text-[9px] text-center border-t border-slate-100 pt-3 mt-1">
                    <div>
                      <div className="text-slate-400">Radiasi</div>
                      <div className="font-extrabold text-med-cyan-dark">95%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Pangan</div>
                      <div className="font-extrabold text-med-teal">90%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Kimia</div>
                      <div className="font-extrabold text-med-orange-dark">85%</div>
                    </div>
                  </div>
                </div>

                {/* Character Profile Card (Dokter Cesi) */}
                <div 
                  onClick={() => setSelectedChar("Dokter Cesi")}
                  className={`cursor-pointer border-2 rounded-2xl p-4 transition-all relative overflow-hidden flex flex-col items-center gap-3 text-center ${selectedChar === "Dokter Cesi" ? "border-med-teal bg-teal-50/10 shadow-md scale-102" : "border-slate-200 bg-white hover:border-slate-350"}`}
                >
                  <div 
                    className="w-20 h-20 rounded-full border-2 border-med-teal bg-slate-100 overflow-hidden flex items-center justify-center relative shadow-sm"
                    style={{ 
                      backgroundImage: "url('https://images.unsplash.com/photo-1534080391025-097b03b74764?auto=format&fit=crop&q=80&w=200')",
                      backgroundSize: "cover",
                      backgroundPosition: "center"
                    }}
                  >
                    <div className="absolute inset-0 bg-med-teal/10" />
                    <span className="absolute bottom-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-med-teal text-white tracking-widest font-mono">
                      CESI
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 flex items-center justify-center gap-1">
                      Dokter Cesi {selectedChar === "Dokter Cesi" && <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </h4>
                    <p className="text-[10px] text-med-teal font-semibold font-mono uppercase tracking-wider">
                      Udang Betina (Lab Expert)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed h-12 overflow-hidden">
                      Fokus pada bio-ekologi laut, dampak radiasi jaringan biota, dan analisis rantai pangan.
                    </p>
                  </div>
                  
                  {/* Cesi Stats */}
                  <div className="w-full grid grid-cols-3 gap-1 font-mono text-[9px] text-center border-t border-slate-100 pt-3 mt-1">
                    <div>
                      <div className="text-slate-400">Radiasi</div>
                      <div className="font-extrabold text-med-cyan-dark">90%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Pangan</div>
                      <div className="font-extrabold text-med-teal">95%</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Kimia</div>
                      <div className="font-extrabold text-med-orange-dark">90%</div>
                    </div>
                  </div>
                </div>

              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSelectRole}
                className="w-full py-3.5 bg-med-teal hover:bg-med-teal-dark text-white font-bold rounded-xl text-sm shadow-teal-glow transition-all flex items-center justify-center gap-2 mt-4"
              >
                <UserCheck className="w-4 h-4" />
                PILIH ROLE & MASUK SIMULATOR
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <div className="mt-8 text-center text-xs text-slate-400 max-w-xs font-sans">
        Dikembangkan untuk Kompetisi OPSI 2026. Mengacu pada silabus fisika radiasi SMP kelas IX.
      </div>
    </main>
  );
}

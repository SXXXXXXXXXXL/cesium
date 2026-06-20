"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Beaker, 
  ArrowLeft, 
  ChevronRight, 
  Info, 
  HelpCircle,
  TrendingDown,
  Activity,
  Calculator,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  LineChart,
  Line
} from "recharts";
import { api } from "../../lib/api";

interface SampleItem {
  id: string;
  type: "water" | "sediment" | "biota";
  location: string;
  radiationLevel: number;
  isCalculated: boolean;
  activity?: number;
}

export default function LabPage() {
  const router = useRouter();
  
  // States
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [selectedSample, setSelectedSample] = useState<SampleItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showSpectrum, setShowSpectrum] = useState(false);
  
  // Math Calculation States
  const [nInput, setNInput] = useState("12580");
  const [n0Input, setN0Input] = useState("520");
  const [epsilonInput, setEpsilonInput] = useState("0.20");
  const [iyInput, setIyInput] = useState("0.851");
  const [mInput, setMInput] = useState("0.50");
  const [tInput, setTInput] = useState("3600");
  const [computedResult, setComputedResult] = useState<number | null>(null);
  const [calcSuccess, setCalcSuccess] = useState(false);
  const [mathError, setMathError] = useState("");

  // Half-life Simulator States
  const [sliderTime, setSliderTime] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizStatus, setQuizStatus] = useState<"idle" | "correct" | "incorrect">("idle");
  const [decaySolved, setDecaySolved] = useState(false);
  
  // Monologue thought state
  const [monologue, setMonologue] = useState("Saya berada di Laboratorium Radiasi. Saya harus menempatkan sampel ke dalam ruang detektor, memulai kalibrasi spektrometer gamma, dan menghitung laju aktivitasnya.");

  const [characterName, setCharacterName] = useState("Dokter Rad");

  // Load samples
  useEffect(() => {
    const loadLabData = async () => {
      try {
        const s = await api.getSamples();
        setSamples(s);
        if (s.length > 0) {
          setSelectedSample(s[0]);
        }

        const p = await api.getProgress();
        setDecaySolved(p.decaySolved);

        const char = p.selectedCharacter || localStorage.getItem("cesium_character");
        if (char) {
          setCharacterName(char);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadLabData();
  }, []);

  // Sync parameters when sample changes
  useEffect(() => {
    if (selectedSample) {
      setShowSpectrum(selectedSample.isCalculated);
      setScanProgress(selectedSample.isCalculated ? 100 : 0);
      setCalcSuccess(selectedSample.isCalculated);
      setComputedResult(selectedSample.isCalculated ? selectedSample.activity || null : null);
      
      if (selectedSample.type === "water") {
        setNInput("12580");
        setN0Input("520");
        setEpsilonInput("0.20");
        setIyInput("0.851");
        setMInput("0.50");
        setTInput("3600");
      } else if (selectedSample.type === "sediment") {
        setNInput("25820");
        setN0Input("520");
        setEpsilonInput("0.20");
        setIyInput("0.851");
        setMInput("0.50");
        setTInput("3600");
      } else {
        setNInput("9640");
        setN0Input("520");
        setEpsilonInput("0.20");
        setIyInput("0.851");
        setMInput("0.25");
        setTInput("3600");
      }
    }
  }, [selectedSample]);

  // Run Spectrometer Scan
  const handleScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setShowSpectrum(false);
    setMonologue("Spektrometer mulai memindai... Sensor mengukur tingkat paparan radiasi gamma dari sampel.");
    
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setShowSpectrum(true);
          setMonologue("Pemindaian spektra selesai. Ada puncak energi gamma yang terdeteksi di koordinat 662 keV.");
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Activity calculation formula: A = (N - N0) / (epsilon * Iy * m * t)
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSample) return;

    const n = parseFloat(nInput);
    const n0 = parseFloat(n0Input);
    const eps = parseFloat(epsilonInput);
    const iy = parseFloat(iyInput);
    const m = parseFloat(mInput);
    const t = parseFloat(tInput);

    if ([n, n0, eps, iy, m, t].some(isNaN)) {
      setMathError("Harap isi seluruh input parameter!");
      return;
    }

    const divisor = eps * iy * m * t;
    if (divisor === 0) {
      setMathError("Pembagian dengan nol tidak diperbolehkan.");
      return;
    }

    setMathError("");
    try {
      const res = await api.calculateActivity(selectedSample.id, {
        n,
        n0,
        epsilon: eps,
        iy,
        m,
        t
      });
      setComputedResult(res.sample.activity);
      setCalcSuccess(true);
      setMonologue(`Perhitungan aktivitas sampel ${selectedSample.type} selesai. Hasil: ${res.sample.activity} Bq/kg.`);
      
      setSamples(prev => prev.map(s => s.id === selectedSample.id ? { ...s, isCalculated: true, activity: res.sample.activity } : s));
    } catch (err: any) {
      setMathError(err.message || "Gagal menghitung aktivitas");
    }
  };

  // Submit Half-Life quiz check
  const handleCheckQuiz = async () => {
    const ans = parseFloat(quizAnswer);
    if (ans === 125) {
      setQuizStatus("correct");
      setMonologue("Benar! Sisa aktivitas radioaktif terhitung tepat 125 Bq setelah 3 kali waktu paruh (90,51 tahun).");
      try {
        await api.updateProgress({
          decaySolved: true,
          score: (await api.getProgress()).score + 50,
          xp: (await api.getProgress()).xp + 100
        });
        setDecaySolved(true);
      } catch (e) {
        console.error(e);
        setDecaySolved(true);
      }
    } else {
      setQuizStatus("incorrect");
    }
  };

  // Generate Spectrometer Chart Data
  const getSpectrumData = () => {
    const data = [];
    const peakCenter = 662;
    const peakHeight = selectedSample?.type === "sediment" ? 2500 : selectedSample?.type === "water" ? 1200 : 850;
    
    for (let channel = 100; channel <= 1200; channel += 10) {
      let count = Math.floor(Math.random() * 20) + 10;
      const diff = Math.abs(channel - peakCenter);
      if (diff < 80) {
        const peakContribution = peakHeight * Math.exp(-(diff * diff) / (2 * 18 * 18));
        count += Math.floor(peakContribution);
      }
      data.push({ energy: channel, cacahan: count });
    }
    return data;
  };

  // Generate Half-life decay curve data
  const getDecayData = () => {
    const data = [];
    const a0 = 1000;
    const halfLife = 30.17;
    for (let years = 0; years <= 150; years += 5) {
      const activity = a0 * Math.pow(0.5, years / halfLife);
      data.push({ years, activity: parseFloat(activity.toFixed(2)) });
    }
    return data;
  };

  const currentDecayActivity = (1000 * Math.pow(0.5, sliderTime / 30.17)).toFixed(2);
  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 20
  };

  const isAllLabDone = samples.length > 0 && samples.every(s => s.isCalculated) && decaySolved;

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
            <div className="w-9 h-9 rounded-xl bg-med-cyan flex items-center justify-center text-white shadow-med-glow animate-pulse">
              <Beaker className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-md font-extrabold text-slate-800 font-sans">{characterName}: Lab Analisis</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Lab Spektroskopi Radiasi</p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push("/hub")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Keluar ke Hub
          </button>
        </div>
      </motion.header>

      {/* Main Workspace */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Card 1: Spectrometer Visual Graph */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={springTransition}
            className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-med-cyan" /> 
                  Gamma Spektrometer
                </h3>
                <p className="text-xs text-slate-500">Mendeteksi puncak spektrum energi isotop radioaktif</p>
              </div>

              {/* Sample Select Option */}
              <select 
                value={selectedSample?.id || ""} 
                onChange={(e) => setSelectedSample(samples.find(s => s.id === e.target.value) || null)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.type.toUpperCase()} - {s.location}
                  </option>
                ))}
              </select>
            </div>

            {/* Spektrometer Display */}
            <div className="relative flex-grow flex items-center justify-center bg-slate-950 rounded-2xl border border-slate-850 min-h-[260px] p-4 text-white overflow-hidden font-mono">
              {isScanning ? (
                <div className="text-center space-y-3 z-10">
                  <span className="text-4xl animate-spin inline-block">🛸</span>
                  <h4 className="text-xs text-med-cyan font-bold tracking-widest uppercase">Mengecek Spektra Sampel...</h4>
                  <div className="w-48 h-1.5 bg-slate-850 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-med-cyan rounded-full transition-all" style={{ width: `${scanProgress}%` }} />
                  </div>
                </div>
              ) : showSpectrum ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getSpectrumData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCacahan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="energy" stroke="#64748b" fontSize={9} label={{ value: "Energi (keV)", position: "insideBottom", offset: -2, fill: "#64748b" }} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: 8, fontSize: 10 }} />
                      <ReferenceLine x={662} stroke="#f97316" strokeDasharray="3 3" label={{ value: "Cs-137 Peak (662 keV)", fill: "#f97316", fontSize: 10, position: "top" }} />
                      <Area type="monotone" dataKey="cacahan" stroke="#06b6d4" fillOpacity={1} fill="url(#colorCacahan)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <span className="text-4xl text-slate-500">🔬</span>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Detektor Spektrometer Siap.</p>
                    <p className="text-[10px] text-slate-500">Letakkan sampel lalu klik Pindai untuk mengukur energi puncak.</p>
                  </div>
                  <button 
                    onClick={handleScan}
                    className="px-5 py-2 bg-med-cyan text-white text-xs font-bold rounded-xl shadow-med-glow hover:bg-med-cyan-dark transition-transform active:scale-95"
                  >
                    Mulai Pindai Spektra
                  </button>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs leading-relaxed text-slate-600 mt-4">
              <span className="font-bold text-amber-800 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-4 h-4" /> Spektroskopi Kalibrasi:
              </span>
              Cs-137 meluruh dengan memancarkan foton gamma monokromatik pada energi puncak <strong>662 keV</strong>.
            </div>
          </motion.div>

          {/* Calculator Math Worksheet */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={springTransition}
            className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-med-teal" />
                Lembar Perhitungan Aktivitas (A)
              </h3>
              <p className="text-xs text-slate-500">Hitung nilai aktivitas sampel berdasarkan laju cacah spektrometer</p>
            </div>

            <div className="my-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="font-mono text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-850 text-sm">Rumus Aktivitas:</div>
                <div className="text-med-cyan-dark text-base font-extrabold py-0.5">A = (N - N0) / (ε × Iy × m × t)</div>
                <div className="text-[10px] text-slate-400">
                  Parameter konstan: Intensitas Gamma (Iy) Cs-137 = 0.851.
                </div>
              </div>
              
              {calcSuccess && computedResult !== null && (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-center shrink-0">
                  <div className="text-[9px] font-bold font-mono">AKTIVITAS TERHITUNG:</div>
                  <div className="text-base font-extrabold font-mono">{computedResult} Bq/kg</div>
                </div>
              )}
            </div>

            <form onSubmit={handleCalculate} className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Cacahan Gross (N)</label>
                <input type="text" value={nInput} onChange={(e) => setNInput(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-med-cyan" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Background (N0)</label>
                <input type="text" value={n0Input} onChange={(e) => setN0Input(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-med-cyan" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Efisiensi Detektor (ε)</label>
                <input type="text" value={epsilonInput} onChange={(e) => setEpsilonInput(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-med-cyan" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Intensitas Gamma (Iy)</label>
                <input type="text" value={iyInput} readOnly className="w-full p-2 border border-slate-200 rounded-lg bg-slate-100 cursor-not-allowed text-slate-400" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Massa Sampel (m - kg)</label>
                <input type="text" value={mInput} onChange={(e) => setMInput(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-med-cyan" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">Waktu Ukur (t - s)</label>
                <input type="text" value={tInput} onChange={(e) => setTInput(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-med-cyan" />
              </div>

              <div className="col-span-2 md:col-span-3 mt-3">
                {mathError && <p className="text-red-500 font-bold mb-2">⚠️ {mathError}</p>}
                
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!showSpectrum}
                  className="w-full py-3.5 bg-med-teal hover:bg-med-teal-dark text-white font-bold rounded-xl shadow-teal-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calculator className="w-4 h-4" /> Hitung &amp; Verifikasi Hasil Ke Database
                </motion.button>
              </div>
            </form>
          </motion.div>

        </div>

        {/* Right Column: Decay & Monologues (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Half-life simulation */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={springTransition}
            className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-2 mb-1">
                <TrendingDown className="w-5 h-5 text-med-orange" />
                Mini Game: Kurva Peluruhan Cs-137
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tarik slider tahun untuk mempelajari laju peluruhan cangkang radioaktif hingga meluruh 150 tahun ke depan.
              </p>
            </div>

            {/* Decay line chart */}
            <div className="bg-slate-50 rounded-2xl border border-slate-150 p-2.5 my-4 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getDecayData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="years" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Line type="monotone" dataKey="activity" stroke="#f97316" strokeWidth={2} dot={false} />
                  <ReferenceLine x={sliderTime} stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Slider */}
            <div className="space-y-2 font-mono text-xs p-3 bg-slate-50 border border-slate-150 rounded-xl mb-4">
              <div className="flex justify-between items-center font-bold">
                <span>Waktu Berjalan (t):</span>
                <span className="text-med-cyan-dark">{sliderTime} Tahun</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="150" 
                value={sliderTime} 
                onChange={(e) => setSliderTime(parseInt(e.target.value))} 
                className="w-full accent-med-cyan cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>A0 = 1000 Bq</span>
                <span>A = {currentDecayActivity} Bq</span>
                <span>t_max = 150th</span>
              </div>
            </div>

            {/* Quiz */}
            <div className="p-4 bg-med-orange-light border border-med-orange/20 rounded-2xl">
              <h4 className="text-xs font-bold text-med-orange-dark uppercase tracking-wider flex items-center gap-1 font-mono">
                <HelpCircle className="w-4 h-4" /> Kuis Waktu Paruh
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Jika aktivitas awal A0 = 1000 Bq, berapakah aktivitas yang tersisa setelah meluruh selama <strong>90,51 tahun</strong>? (Waktu paruh: 30,17 tahun)
              </p>
              
              <div className="flex items-center gap-2 mt-3 font-mono">
                <input 
                  type="text" 
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  placeholder="Jawaban (Bq)..." 
                  disabled={decaySolved}
                  className="flex-grow p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-med-orange"
                />
                
                {decaySolved ? (
                  <span className="px-3 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1">
                    ✓ LULUS
                  </span>
                ) : (
                  <button 
                    onClick={handleCheckQuiz}
                    className="p-2 px-4 bg-med-orange text-white text-xs font-bold rounded-lg shadow-orange-glow hover:bg-med-orange-dark transition-all"
                  >
                    Kirim
                  </button>
                )}
              </div>

              {quizStatus === "correct" && (
                <p className="text-[10px] font-bold text-emerald-600 mt-2">✓ Jawaban tepat! Tersisa tepat 125 Bq setelah 3 siklus waktu paruh.</p>
              )}
              {quizStatus === "incorrect" && (
                <p className="text-[10px] font-bold text-red-500 mt-2">❌ Salah. Hint: 90.51 / 30.17 = 3 kali waktu paruh.</p>
              )}
            </div>

          </motion.div>

          {/* Monologue */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-4 md:p-6 flex items-start gap-4">
            <span className="text-3xl filter saturate-100">🦐</span>
            <div className="flex-grow space-y-1">
              <h4 className="text-xs font-extrabold text-slate-400 tracking-wider uppercase font-mono">Monolog {characterName}</h4>
              <p className="text-sm italic text-slate-600 leading-relaxed">
                "{monologue}"
              </p>
            </div>
          </div>

          {/* Progres Lab */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-med-glow p-6 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Progres Laboratorium</h4>
            
            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between">
                <span>Persentase Hasil Aktivitas Lab:</span>
                <span className="font-bold font-mono text-med-cyan-dark">
                  {samples.length > 0 && samples.every(s => s.isCalculated) ? "100% SUKSES" : `${samples.filter(s => s.isCalculated).length}/${samples.length} TERVERIFIKASI`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tes Kognitif Peluruhan:</span>
                <span className="font-bold font-mono text-med-cyan-dark">
                  {decaySolved ? "100% SELESAI" : "BELUM LULUS"}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              {isAllLabDone ? (
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/resolution")}
                  className="w-full py-3.5 bg-med-cyan hover:bg-med-cyan-dark text-white font-bold rounded-2xl text-sm shadow-med-glow transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Masuk ke Resolusi Laporan &rarr;
                </motion.button>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5"
                >
                  Selesaikan Seluruh Data Lab Sebelum Melanjutkan
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 Kementrian Kelautan dan Keamanan Pangan - Proyek Edukasi Fisika Radiasi OPSI</p>
      </footer>

    </main>
  );
}

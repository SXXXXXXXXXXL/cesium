const BASE_URL = "http://localhost:3001/api";

// Helper to get headers
const getHeaders = () => {
  const token = typeof window !== "undefined" ? localStorage.getItem("cesium_token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Verify if backend server is online
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const res = await fetch("http://localhost:3001/health", { method: "GET" });
    return res.ok;
  } catch (e) {
    return false;
  }
};

// Mock / Local Storage fallback implementation
const localStore = {
  get: (key: string, defaultVal: any) => {
    if (typeof window === "undefined") return defaultVal;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  },
  set: (key: string, val: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, JSON.stringify(val));
    }
  }
};

// API Functions
export const api = {
  // Authentication
  register: async (username: string, password?: string) => {
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: password || "player123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to register");
      
      localStorage.setItem("cesium_token", data.token);
      localStorage.setItem("cesium_username", data.username);
      return data;
    } catch (e) {
      console.log("[API Fallback]: Registering user in localStorage");
      localStorage.setItem("cesium_username", username);
      const mockProgress = {
        currentModule: 1,
        currentPanel: 1,
        score: 0,
        xp: 0,
        fishermanInterviewed: false,
        activityCalculated: false,
        decaySolved: false,
        timelineSolved: false,
        laporanExported: false,
        selectedCharacter: "Dokter Rad",
      };
      localStore.set(`progress_${username}`, mockProgress);
      localStore.set(`samples_${username}`, []);
      return { username, offline: true };
    }
  },

  login: async (username: string, password?: string) => {
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: password || "player123" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to login");

      localStorage.setItem("cesium_token", data.token);
      localStorage.setItem("cesium_username", data.username);
      return data;
    } catch (e) {
      console.log("[API Fallback]: Logging in user via localStorage");
      localStorage.setItem("cesium_username", username);
      return { username, offline: true };
    }
  },

  // Game Progress
  getProgress: async () => {
    const username = localStorage.getItem("cesium_username") || "guest";
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/progress`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to get progress");
      return await res.json();
    } catch (e) {
      return localStore.get(`progress_${username}`, {
        currentModule: 1,
        currentPanel: 1,
        score: 0,
        xp: 0,
        fishermanInterviewed: false,
        activityCalculated: false,
        decaySolved: false,
        timelineSolved: false,
        laporanExported: false,
        selectedCharacter: "Dokter Rad",
      });
    }
  },

  updateProgress: async (updateData: any) => {
    const username = localStorage.getItem("cesium_username") || "guest";
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/progress`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      return await res.json();
    } catch (e) {
      const current = localStore.get(`progress_${username}`, {
        currentModule: 1,
        currentPanel: 1,
        score: 0,
        xp: 0,
        fishermanInterviewed: false,
        activityCalculated: false,
        decaySolved: false,
        timelineSolved: false,
        laporanExported: false,
        selectedCharacter: "Dokter Rad",
      });
      const updated = { ...current, ...updateData };
      localStore.set(`progress_${username}`, updated);
      return { progress: updated, offline: true };
    }
  },

  // Samples
  getSamples: async () => {
    const username = localStorage.getItem("cesium_username") || "guest";
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/samples`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to get samples");
      return await res.json();
    } catch (e) {
      return localStore.get(`samples_${username}`, []);
    }
  },

  createSample: async (type: string, location: string, radiationLevel: number) => {
    const username = localStorage.getItem("cesium_username") || "guest";
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/samples`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ type, location, radiationLevel }),
      });
      if (!res.ok) throw new Error("Failed to create sample");
      return await res.json();
    } catch (e) {
      const samples = localStore.get(`samples_${username}`, []);
      const newSample = {
        id: Math.random().toString(36).substring(7),
        type,
        location,
        radiationLevel,
        isCalculated: false,
        collectedAt: new Date().toISOString()
      };
      localStore.set(`samples_${username}`, [...samples, newSample]);
      return { sample: newSample, offline: true };
    }
  },

  calculateActivity: async (sampleId: string, mathData: { n: number, n0: number, epsilon: number, iy: number, m: number, t: number }) => {
    const username = localStorage.getItem("cesium_username") || "guest";
    try {
      const isOnline = await checkBackendHealth();
      if (!isOnline) throw new Error("Offline mode");

      const res = await fetch(`${BASE_URL}/samples/${sampleId}/calculate`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(mathData),
      });
      if (!res.ok) throw new Error("Failed to calculate sample");
      return await res.json();
    } catch (e) {
      const samples = localStore.get(`samples_${username}`, []);
      
      const divisor = mathData.epsilon * mathData.iy * mathData.m * mathData.t;
      if (divisor === 0) throw new Error("Division by zero");
      const calculatedActivity = (mathData.n - mathData.n0) / divisor;

      let updatedSample = null;
      const updatedSamples = samples.map((s: any) => {
        if (s.id === sampleId) {
          updatedSample = {
            ...s,
            ...mathData,
            activity: parseFloat(calculatedActivity.toFixed(4)),
            isCalculated: true
          };
          return updatedSample;
        }
        return s;
      });

      localStore.set(`samples_${username}`, updatedSamples);
      
      // Update progress score
      const currentProgress = localStore.get(`progress_${username}`, { score: 0, xp: 0 });
      localStore.set(`progress_${username}`, {
        ...currentProgress,
        activityCalculated: true,
        score: currentProgress.score + 50,
        xp: currentProgress.xp + 100
      });

      return { sample: updatedSample, offline: true };
    }
  }
};

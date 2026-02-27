import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Fingerprint, Lock, User, ArrowRight } from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: any, riskScore: number, action: string) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Telemetry state
  const keyPresses = useRef<number[]>([]);
  const lastKeyTime = useRef<number | null>(null);
  const mouseMovements = useRef<{ x: number; y: number; time: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseMovements.current.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      });
      if (mouseMovements.current.length > 100) {
        mouseMovements.current.shift(); // Keep last 100 movements
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleKeyDown = () => {
    const now = Date.now();
    if (lastKeyTime.current) {
      keyPresses.current.push(now - lastKeyTime.current);
    }
    lastKeyTime.current = now;
  };

  const calculateTelemetry = () => {
    // Calculate average typing speed (ms per key)
    const avgTypingSpeed =
      keyPresses.current.length > 0
        ? keyPresses.current.reduce((a, b) => a + b, 0) /
          keyPresses.current.length
        : 250; // default

    // Calculate average mouse speed (pixels per second)
    let totalDistance = 0;
    let totalTime = 0;
    if (mouseMovements.current.length > 1) {
      for (let i = 1; i < mouseMovements.current.length; i++) {
        const p1 = mouseMovements.current[i - 1];
        const p2 = mouseMovements.current[i];
        const dist = Math.sqrt(
          Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2),
        );
        const time = p2.time - p1.time;
        if (time > 0) {
          totalDistance += dist;
          totalTime += time;
        }
      }
    }
    const avgMouseSpeed =
      totalTime > 0 ? (totalDistance / totalTime) * 1000 : 500;

    return {
      typingSpeed: avgTypingSpeed,
      mouseSpeed: avgMouseSpeed,
      deviceId: "device-hash-123", // Simulated device fingerprint
      ip: "127.0.0.1", // Simulated IP
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const telemetry = calculateTelemetry();

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, telemetry }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user, data.riskScore, data.action);
    } catch (err) {
      setError("Network error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl" />

        <div className="flex justify-center mb-8">
          <div className="p-3 bg-zinc-800 rounded-xl border border-zinc-700">
            <Fingerprint className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            FinTechNow Secure
          </h1>
          <p className="text-zinc-400 text-sm">UBPADS Authentication Gateway</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm"
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <p>{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300 ml-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-zinc-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
            ) : (
              <>
                Secure Login
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-500 flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-3 h-3" />
            Protected by Behavioral Biometrics
          </p>
        </div>
      </motion.div>
    </div>
  );
}

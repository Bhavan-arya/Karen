import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ScanFace, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react";

interface ReAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ReAuth({ onSuccess, onCancel }: ReAuthProps) {
  const [status, setStatus] = useState<
    "scanning" | "verifying" | "success" | "failed"
  >("scanning");

  useEffect(() => {
    // Simulate biometric scanning process
    const scanTimer = setTimeout(() => setStatus("verifying"), 2000);
    const verifyTimer = setTimeout(() => setStatus("success"), 4000);
    const successTimer = setTimeout(() => onSuccess(), 5500);

    return () => {
      clearTimeout(scanTimer);
      clearTimeout(verifyTimer);
      clearTimeout(successTimer);
    };
  }, [onSuccess]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-red-500/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden text-center"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />

        <div className="mb-6 inline-flex items-center justify-center p-4 bg-red-500/10 rounded-full border border-red-500/20">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h2 className="text-xl font-bold text-white mb-2">
          High Risk Login Detected
        </h2>
        <p className="text-zinc-400 text-sm mb-8">
          Your behavioral patterns deviate significantly from your baseline
          profile. Please verify your identity using facial recognition.
        </p>

        <div className="relative w-48 h-48 mx-auto mb-8 bg-zinc-950 rounded-2xl border-2 border-dashed border-zinc-800 flex items-center justify-center overflow-hidden">
          {status === "scanning" && (
            <>
              <motion.div
                animate={{ y: [-100, 100] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute w-full h-1 bg-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10"
              />
              <ScanFace className="w-16 h-16 text-zinc-600" />
            </>
          )}

          {status === "verifying" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <span className="text-xs font-medium text-emerald-400">
                Verifying Biometrics...
              </span>
            </div>
          )}

          {status === "success" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-400">
                Identity Confirmed
              </span>
            </motion.div>
          )}
        </div>

        <button
          onClick={onCancel}
          disabled={status === "success"}
          className="text-sm text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel Authentication
        </button>
      </motion.div>
    </div>
  );
}

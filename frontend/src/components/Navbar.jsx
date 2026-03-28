import React from "react";
import { Wifi, WifiOff, Gamepad2 } from "lucide-react";

export default function Navbar({
  tab,
  setTab,
  isConnected,
  isGameVisible,
  setIsGameVisible,
  setIsGamePaused,
  setShowServerWarning,
}) {
  return (
    <nav className="fixed z-50 left-0 right-0 mx-auto flex justify-between items-center backdrop-blur-lg transition-all duration-500 top-3 md:top-5 w-[94%] md:w-[95%] max-w-6xl rounded-2xl md:rounded-3xl bg-bgMain/65 py-2 px-2.5 md:py-3 md:px-6 shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-white/5 md:border-primary/20">
      <div className="flex items-center gap-2 md:gap-5">
        <img
          src="/logo.png"
          alt="FileShare Logo"
          className="object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.8)] h-7 md:h-10 w-auto ml-1 md:ml-0"
          style={{ imageRendering: "high-quality" }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />
        <span className="font-black tracking-tight hidden sm:block text-xl md:text-3xl text-white/90">
          ShareFile.
        </span>
      </div>

      <div className="flex bg-black/30 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-white/5 shadow-inner backdrop-blur-md">
        <button
          onClick={() => setTab("file")}
          className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${
            tab === "file"
              ? "bg-surface shadow-md text-white border border-white/10"
              : "text-textMuted hover:text-white"
          }`}
        >
          File Share
        </button>
        <button
          onClick={() => setTab("code")}
          className={`px-2.5 py-1.5 sm:px-4 sm:py-2 md:px-5 rounded-md md:rounded-lg text-[10px] sm:text-xs md:text-sm font-bold transition-all duration-300 ${
            tab === "code"
              ? "bg-surface shadow-md text-white border border-white/10"
              : "text-textMuted hover:text-white"
          }`}
        >
          Code Room
        </button>
      </div>

      <div className="flex items-center gap-1.5 md:gap-3">
        {isConnected && (
          <button
            onClick={() => {
              setIsGameVisible((prev) => !prev);
              setIsGamePaused(false);
              setShowServerWarning(false);
            }}
            className={`p-1.5 md:p-2 rounded-lg transition-all border shadow-sm ${
              isGameVisible
                ? "bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                : "bg-surface/50 text-textMuted hover:text-white hover:bg-surface/80 border-white/5 hover:border-primary/50"
            }`}
            title={isGameVisible ? "Minimize Game" : "Play Neon Runner"}
          >
            <Gamepad2 size={14} className="md:w-[18px] md:h-[18px]" />
          </button>
        )}

        <div
          className={`flex items-center gap-1 md:gap-2 px-1.5 py-1 md:px-4 md:py-1.5 rounded-md md:rounded-full text-[9px] md:text-xs font-bold border backdrop-blur-sm transition-colors ${
            isConnected
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {isConnected ? (
            <Wifi size={10} className="md:w-[14px] md:h-[14px]" />
          ) : (
            <WifiOff size={10} className="md:w-[14px] md:h-[14px]" />
          )}
          <span className="hidden sm:inline">
            {isConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </nav>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import {
  AlertCircle,
  X,
  Minus,
  Loader2,
  Zap,
  ShieldCheck,
  Infinity,
  Github,
  Linkedin,
  Gamepad2,
} from "lucide-react";

// Components
import DinoGame from "./components/DinoGame";
import FileShare from "./components/FileShare";
import CodeRoom from "./components/CodeRoom";
import Navbar from "./components/Navbar";
import WelcomeModal from "./components/WelcomeModal";
import NearbyRadar from "./components/NearbyRadar";

// === CONNECTING TO YOUR LIVE RENDER SERVER ===
const socket = io("https://fileshare-r6cf.onrender.com", {
  transports: ["websocket"],
  withCredentials: true,
});

// --- RESPONSIVE GLOBAL TRACKING GRID ---
const InteractiveGrid = React.memo(() => {
  const [gridData, setGridData] = useState({ cols: 0, rows: 0, size: 100 });

  useEffect(() => {
    const calculateGrid = () => {
      const blockSize = window.innerWidth < 768 ? 60 : 100;
      const cols = Math.ceil(window.innerWidth / blockSize);
      const rows = Math.ceil(window.innerHeight / blockSize);
      setGridData({ cols, rows, size: blockSize });
    };

    calculateGrid();
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateGrid, 200);
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e) => {
      const blockSize = window.innerWidth < 768 ? 60 : 100;
      const col = Math.floor(e.clientX / blockSize);
      const row = Math.floor(e.clientY / blockSize);
      const target = document.getElementById(`grid-block-${col}-${row}`);

      if (target && !target.classList.contains("active-glow")) {
        target.classList.add("active-glow");
        const brandPurple = "139, 92, 246";
        target.style.transitionDuration = "0s";
        target.style.backgroundColor = `rgba(${brandPurple}, 0.3)`;
        target.style.boxShadow = `0 0 15px rgba(${brandPurple}, 0.9), 0 0 35px rgba(${brandPurple}, 0.5)`;
        target.style.opacity = "1";

        setTimeout(() => {
          if (target) {
            target.classList.remove("active-glow");
            target.style.transitionDuration = "2500ms";
            target.style.backgroundColor = "transparent";
            target.style.boxShadow = "none";
            target.style.opacity = "0.5";
          }
        }, 50);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 grid w-full h-full bg-bgMain overflow-hidden pointer-events-none"
      style={{
        gridTemplateColumns: `repeat(${gridData.cols}, 1fr)`,
        gridTemplateRows: `repeat(${gridData.rows}, 1fr)`,
      }}
    >
      {Array.from({ length: gridData.cols * gridData.rows }).map((_, i) => {
        const col = i % gridData.cols;
        const row = Math.floor(i / gridData.cols);
        return (
          <div
            key={i}
            id={`grid-block-${col}-${row}`}
            className="border-[0.5px] border-primary/[0.05] opacity-50 transition-all ease-out will-change-[background-color,box-shadow,opacity]"
          />
        );
      })}
    </div>
  );
});

// === SMOOTH TYPEWRITER ===
const Typewriter = ({ words }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timeout;
    const currentWord = words[currentWordIndex];

    if (!isDeleting && currentText === currentWord) {
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2500);
    } else if (isDeleting && currentText === "") {
      timeout = setTimeout(() => {
        setIsDeleting(false);
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
      }, 600);
    } else {
      const typingSpeed = isDeleting ? 100 : 250;
      timeout = setTimeout(() => {
        setCurrentText(
          currentWord.substring(0, currentText.length + (isDeleting ? -1 : 1)),
        );
      }, typingSpeed);
    }
    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words]);

  return (
    <span className="flex items-center justify-center min-h-[1.2em]">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
        {currentText === "" ? "\u00A0" : currentText}
      </span>
      <span className="inline-block w-[3px] md:w-[6px] h-[0.9em] bg-primary ml-1 md:ml-2 animate-pulse rounded-full"></span>
    </span>
  );
};

export default function App() {
  const [tab, setTab] = useState("file");
  const [isConnected, setIsConnected] = useState(socket.connected);

  // Game UI States
  const [isGameVisible, setIsGameVisible] = useState(!socket.connected);
  const [isGamePaused, setIsGamePaused] = useState(false);
  const [showServerWarning, setShowServerWarning] = useState(false);
  const wasOffline = useRef(!socket.connected);

  // Error State for modern toasts
  const [errorToast, setErrorToast] = useState({ show: false, message: "" });
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setIsConnected(false));

    socket.on("error", (msg) => {
      setErrorToast({ show: true, message: msg.message || msg });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => {
        setErrorToast({ show: false, message: "" });
      }, 3500);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("error");
    };
  }, []);

  useEffect(() => {
    if (isConnected) {
      if (wasOffline.current) {
        if (isGameVisible) {
          setShowServerWarning(true);
          setIsGamePaused(true);
        }
        wasOffline.current = false;
      }
    } else {
      wasOffline.current = true;
      setIsGameVisible(true);
      setIsGamePaused(false);
      setShowServerWarning(false);
    }
  }, [isConnected, isGameVisible]);

  // [NEW] Function to handle when a user clicks a device on the radar
  const handleRadarConnect = (targetSocketId) => {
    console.log("Ready to connect to:", targetSocketId);
    // You can add your logic here to start the WebRTC connection
    // or trigger an automatic file share room join!
  };

  return (
    <div className="min-h-screen bg-bgMain text-white font-sans selection:bg-primary/30 relative flex flex-col overflow-x-hidden">
      {/* [UPDATED] WELCOME MODAL PLACED HERE WITH SOCKET PROP */}
      <WelcomeModal socket={socket} />

      <InteractiveGrid />

      {/* MODERN ERROR TOAST NOTIFICATION */}
      {errorToast.show && (
        <div className="fixed bottom-8 right-4 md:bottom-10 md:right-10 z-[200] animate-fade-in-up">
          <div className="bg-surface/90 backdrop-blur-xl border border-red-500/50 shadow-[0_10px_40px_rgba(239,68,68,0.25)] px-5 py-3 md:px-6 md:py-4 rounded-2xl flex items-center gap-3">
            <div className="bg-red-500/20 p-1.5 md:p-2 rounded-full shrink-0">
              <AlertCircle className="text-red-400 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="text-white font-semibold text-xs md:text-sm">
              {errorToast.message}
            </span>
            <button
              onClick={() => {
                setErrorToast({ show: false, message: "" });
                if (toastTimeoutRef.current)
                  clearTimeout(toastTimeoutRef.current);
              }}
              className="text-textMuted hover:text-white ml-2 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* NAVBAR COMPONENT */}
      <Navbar
        tab={tab}
        setTab={setTab}
        isConnected={isConnected}
        isGameVisible={isGameVisible}
        setIsGameVisible={setIsGameVisible}
        setIsGamePaused={setIsGamePaused}
        setShowServerWarning={setShowServerWarning}
      />

      <main className="relative z-10 pt-28 md:pt-40 pb-12 px-4 md:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        {/* HERO */}
        <div className="text-center mb-10 md:mb-16 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-4 tracking-tight flex flex-col items-center justify-center gap-1 md:gap-2">
            <span>Share without</span>
            <Typewriter words={["Logins", "Servers", "Trace", "Limits"]} />
          </h1>
          <p className="text-textMuted max-w-sm md:max-w-lg mx-auto text-sm md:text-lg mt-4 md:mt-6">
            Secure, anonymous, peer-to-peer file transfer. No sign-ups, no
            limits.
          </p>
        </div>

        {/* DINO GAME */}
        {isGameVisible && (
          <div className="w-full bg-surface/40 backdrop-blur-md rounded-3xl border border-borderCol overflow-hidden relative mb-10 shadow-[0_0_40px_rgba(0,0,0,0.3)] flex flex-col animate-fade-in-up">
            <button
              onClick={() => {
                setIsGameVisible(false);
                setShowServerWarning(false);
                setIsGamePaused(false);
              }}
              className="absolute top-4 right-4 z-20 p-2 bg-bgMain/60 hover:bg-bgMain text-textMuted hover:text-white rounded-xl border border-borderCol/50 transition-all hover:scale-105"
              title="Minimize Game"
            >
              <Minus size={20} />
            </button>

            {showServerWarning && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in-up">
                <div className="bg-surface border border-emerald-500/50 p-6 md:p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.2)] text-center max-w-sm md:max-w-md mx-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  <button
                    onClick={() => {
                      setShowServerWarning(false);
                      setIsGamePaused(false);
                    }}
                    className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors bg-inputBg p-1.5 rounded-lg hover:bg-red-500/20 hover:text-red-400"
                  >
                    <X size={18} />
                  </button>
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <span className="text-3xl">🐹</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-white mb-2 tracking-wide flex items-center justify-center gap-2">
                    IT'S ALIVE! <span className="text-emerald-400">⚡</span>
                  </h3>
                  <p className="text-sm md:text-base text-textMuted mb-6 leading-relaxed">
                    The backend hamsters finally finished their coffee!{" "}
                    <br className="hidden md:block" />
                    You can keep running from your responsibilities, or minimize
                    the game to actually transfer some files.
                  </p>
                  <button
                    onClick={() => {
                      setIsGameVisible(false);
                      setShowServerWarning(false);
                      setIsGamePaused(false);
                    }}
                    className="w-full bg-emerald-500 py-3 md:py-4 rounded-xl text-white font-bold transition-all hover:bg-emerald-400 hover:-translate-y-1 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex justify-center items-center gap-2 text-sm md:text-base"
                  >
                    Go back to work!!!
                  </button>
                </div>
              </div>
            )}

            <div className="z-10 text-center p-5 md:p-6 bg-bgMain/60 border-b border-borderCol/50 shadow-sm flex flex-col md:flex-row items-center justify-center gap-4">
              {!isConnected ? (
                <>
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-primary animate-spin drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                  <div className="text-center md:text-left pr-8">
                    <h2 className="text-lg md:text-xl font-black text-white tracking-widest uppercase drop-shadow-md">
                      Establishing Link...
                    </h2>
                    <p className="text-textMuted text-xs md:text-sm font-medium leading-relaxed">
                      The server is waking up. Press{" "}
                      <span className="text-primary font-bold">Space</span> or{" "}
                      <span className="text-primary font-bold">Tap</span> to
                      play the Neon Runner!
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-primary drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
                  <div className="text-center md:text-left pr-8">
                    <h2 className="text-lg md:text-xl font-black text-white tracking-widest uppercase drop-shadow-md">
                      Procrastination Station
                    </h2>
                    <p className="text-textMuted text-xs md:text-sm font-medium leading-relaxed">
                      Servers are fully operational! You{" "}
                      <span className="italic">should</span> probably hit
                      minimize and work... but that high score isn't going to
                      beat itself. 🤫
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="w-full p-2 py-6 md:p-10 flex justify-center items-center bg-black/20">
              <DinoGame isPaused={isGamePaused} />
            </div>
          </div>
        )}

        {/* TAB WRAPPER */}
        <div
          className="w-full"
          style={{
            animation: "tabSwitch 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards",
          }}
        >
          <style>{`
            @keyframes tabSwitch {
              0% { opacity: 0; transform: scale(0.98) translateY(15px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>

          {/* Render both but hide the inactive one to preserve states! */}
          <div style={{ display: tab === "file" ? "block" : "none" }}>
            {/* The Nearby Radar is cleanly integrated right above FileShare */}
            <div className="w-full max-w-2xl mx-auto mb-6">
              <NearbyRadar socket={socket} onConnect={handleRadarConnect} />
            </div>

            <FileShare socket={socket} isConnected={isConnected} />
          </div>

          <div style={{ display: tab === "code" ? "block" : "none" }}>
            <CodeRoom socket={socket} isConnected={isConnected} />
          </div>
        </div>

        {/* FEATURES */}
        <div
          className="mt-auto pt-24 md:pt-32 pb-6 md:pb-8 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-surface/60 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="text-primary w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">
              Lightning Fast
            </h3>
            <p className="text-textMuted text-xs md:text-sm leading-relaxed">
              Direct peer-to-peer WebSocket infrastructure ensures instant,
              unthrottled data movement across devices.
            </p>
          </div>
          <div className="bg-surface/60 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="text-secondary w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">
              Zero Logs Policy
            </h3>
            <p className="text-textMuted text-xs md:text-sm leading-relaxed">
              Absolute privacy. No accounts required, and data is permanently
              wiped from memory the moment a transfer completes.
            </p>
          </div>
          <div className="bg-surface/60 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
              <Infinity className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white">
              Unrestricted Limits
            </h3>
            <p className="text-textMuted text-xs md:text-sm leading-relaxed">
              Share massive datasets, high-res videos, or entire project folders
              seamlessly via drag-and-drop or clipboard paste.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-20 mt-auto w-full border-t border-borderCol bg-bgMain/60 backdrop-blur-xl py-6 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-textMuted text-xs md:text-sm">
            © 2026 FileShare. Secure File Infrastructure.
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Madhav7871"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textMuted hover:text-primary transition-colors hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]"
            >
              <Github size={20} className="md:w-[22px] md:h-[22px]" />
            </a>
            <a
              href="https://www.linkedin.com/in/madhav-kalra-807252242/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textMuted hover:text-secondary transition-colors hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]"
            >
              <Linkedin size={20} className="md:w-[22px] md:h-[22px]" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

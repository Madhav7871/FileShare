import { useState, useEffect } from "react";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // 1. Check local storage on mount
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  // 2. Handle the 5-second auto-close timer
  useEffect(() => {
    let timer;
    if (isOpen && !isExiting) {
      timer = setTimeout(() => {
        handleClose();
      }, 5000); // 5000ms = 5 seconds
    }
    // Cleanup timer if the user closes it manually before 5 seconds
    return () => clearTimeout(timer);
  }, [isOpen, isExiting]);

  // 3. Smooth closing function
  const handleClose = () => {
    setIsExiting(true); // Trigger exit animation
    localStorage.setItem("hasSeenWelcomeModal", "true"); // Save to storage

    // Wait for the CSS exit animation to finish before removing from DOM
    setTimeout(() => {
      setIsOpen(false);
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${
        isExiting
          ? "bg-black/0 backdrop-blur-none"
          : "bg-black/60 backdrop-blur-sm"
      }`}
    >
      {/* Required CSS for the countdown bar */}
      <style>{`
        @keyframes shrinkBar {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>

      {/* Modal Box */}
      <div
        className={`bg-surface/90 backdrop-blur-xl border border-borderCol rounded-[2rem] w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isExiting
            ? "opacity-0 scale-95 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Animated Countdown Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-inputBg w-full z-20">
          <div
            className="h-full bg-gradient-to-r from-primary to-secondary origin-left"
            style={{
              animation: "shrinkBar 5s linear forwards",
            }}
          />
        </div>

        {/* Close 'X' Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-20"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center relative z-10">
          {/* Animated Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-inner">
            <span
              className="text-3xl animate-bounce"
              style={{ animationDuration: "2s" }}
            >
              👋
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              FileShare.
            </span>
          </h2>

          <p className="text-textMuted text-sm md:text-base mb-8 leading-relaxed">
            Secure, anonymous, peer-to-peer file transfer. No sign-ups, no
            tracking, no limits.
          </p>

          <button
            onClick={handleClose}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
          >
            Let's go!
          </button>
        </div>
      </div>
    </div>
  );
}

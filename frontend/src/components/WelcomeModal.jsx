import { useState, useEffect } from "react";
import { User, ArrowRight, ShieldCheck } from "lucide-react";

// Passed the socket prop here!
export default function WelcomeModal({ socket }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [name, setName] = useState(""); // State to hold the user's name

  // 1. Check local storage on mount
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenWelcome) {
      setIsOpen(true);
      // Prevent scrolling while modal is open
      document.body.style.overflow = "hidden";
    }
  }, []);

  // 2. Smooth closing & submission function
  const handleSubmit = (e) => {
    if (e) e.preventDefault(); // Prevent page refresh on form submit

    // If they entered a name, send it to the backend!
    if (name.trim() && socket) {
      socket.emit("set_name", name.trim());
    }

    setIsExiting(true); // Trigger exit animation
    localStorage.setItem("hasSeenWelcomeModal", "true"); // Save to storage
    document.body.style.overflow = "auto"; // Restore scrolling

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
      {/* Modal Box */}
      <div
        className={`bg-surface/90 backdrop-blur-xl border border-borderCol rounded-[2rem] w-full max-w-md p-8 relative shadow-[0_0_50px_rgba(139,92,246,0.15)] overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isExiting
            ? "opacity-0 scale-95 translate-y-4"
            : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Close 'X' Button */}
        <button
          onClick={() => handleSubmit()}
          className="absolute top-4 right-4 text-textMuted hover:text-white transition-colors p-2 rounded-full hover:bg-white/10 z-20"
        >
          ✕
        </button>

        {/* Content */}
        <div className="text-center relative z-10">
          {/* Animated Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20 shadow-inner">
            <User className="text-primary w-8 h-8 animate-pulse" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              FileShare
            </span>
          </h2>

          <p className="text-textMuted text-sm md:text-base mb-6 leading-relaxed">
            Set a display name so people nearby know who they are connecting to
            on the radar.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoFocus
                className="w-full bg-black/30 border border-borderCol text-white px-5 py-4 rounded-xl focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all placeholder:text-gray-600 text-center text-lg font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 group"
            >
              {name.trim() ? "Enter FileShare" : "Skip (Use Default Name)"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-textMuted">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            <span>Your name is only visible to nearby users.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

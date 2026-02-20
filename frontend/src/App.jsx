import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
  CloudUpload,
  CloudDownload,
  Code2,
  Wifi,
  WifiOff,
  Copy,
  CheckCircle2,
  File,
  Loader2,
  Github,
  Linkedin,
  Zap,
  ShieldCheck,
  Infinity,
  Image as ImageIcon,
  FileText,
  Film,
  X,
} from "lucide-react";

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
      // Use 60px blocks on mobile, 100px blocks on desktop
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
      // Use the current dynamic block size
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
  const [isScrolled, setIsScrolled] = useState(false);

  // File Share State
  const [files, setFiles] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Code Room State
  const [codeRoomId, setCodeRoomId] = useState("");
  const [code, setCode] = useState("// Start coding...");
  const [isJoined, setIsJoined] = useState(false);

  // Preview State
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const handlePaste = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      if (
        e.clipboardData &&
        e.clipboardData.files &&
        e.clipboardData.files.length > 0
      ) {
        e.preventDefault();
        const pastedFiles = Array.from(e.clipboardData.files);
        setFiles((prev) => [...prev, ...pastedFiles]);
        setTab("file");
      }
    };
    window.addEventListener("paste", handlePaste);

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", () => setIsConnected(false));
    socket.on("room_created", (code) => {
      setRoomCode(code);
      setIsEncrypting(false);
    });
    socket.on("file_received", (data) => setReceivedFiles(data.files));
    socket.on("error", (msg) => alert(msg));
    socket.on("code_update", (newCode) => setCode(newCode));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("paste", handlePaste);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("room_created");
      socket.off("file_received");
      socket.off("error");
      socket.off("code_update");
    };
  }, []);

  const handleSend = () => {
    if (files.length === 0) return;
    setIsEncrypting(true);
    const promises = files.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader();
          r.onload = (e) =>
            res({
              fileName: f.name,
              fileData: e.target.result,
              fileSize: f.size,
            });
          r.readAsDataURL(f);
        }),
    );
    Promise.all(promises).then((data) =>
      socket.emit("create_room", { files: data }),
    );
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  // Preview Logic
  const handlePreview = (fileObj, isReceived = false) => {
    if (isReceived) {
      const mimeType = fileObj.fileData.substring(
        5,
        fileObj.fileData.indexOf(";"),
      );
      setPreviewData({
        url: fileObj.fileData,
        name: fileObj.fileName,
        type: mimeType,
        isReceived: true,
      });
    } else {
      const url = URL.createObjectURL(fileObj);
      setPreviewData({
        url,
        name: fileObj.name,
        type: fileObj.type,
        isReceived: false,
      });
    }
  };

  const closePreview = () => {
    if (previewData && previewData.url.startsWith("blob:")) {
      URL.revokeObjectURL(previewData.url);
    }
    setPreviewData(null);
  };

  const getFileIcon = (type, className) => {
    if (type.startsWith("image/"))
      return <ImageIcon size={16} className={className} />;
    if (type.startsWith("video/"))
      return <Film size={16} className={className} />;
    if (
      type === "application/pdf" ||
      type.includes("document") ||
      type.startsWith("text/")
    )
      return <FileText size={16} className={className} />;
    return <File size={16} className={className} />;
  };

  return (
    <div className="min-h-screen bg-bgMain text-white font-sans selection:bg-primary/30 relative flex flex-col overflow-x-hidden">
      <InteractiveGrid />

      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 md:p-4 animate-fade-in-up">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-surface border border-borderCol rounded-2xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-3 md:p-4 border-b border-borderCol bg-bgMain/80">
              <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                {getFileIcon(previewData.type, "text-primary shrink-0")}
                <h3 className="font-bold text-sm md:text-lg truncate">
                  {previewData.name}
                </h3>
              </div>
              <button
                onClick={closePreview}
                className="p-1.5 md:p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-colors shrink-0 ml-2"
              >
                <X size={20} className="md:w-6 md:h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-black/30 p-2 md:p-4">
              {previewData.type.startsWith("image/") ? (
                <img
                  src={previewData.url}
                  alt="Preview"
                  className="max-w-full max-h-[75vh] object-contain rounded-lg drop-shadow-2xl"
                />
              ) : previewData.type === "application/pdf" ||
                previewData.type.startsWith("text/") ? (
                <iframe
                  src={previewData.url}
                  className="w-full h-[75vh] rounded-lg bg-white shadow-inner"
                  title="Document Preview"
                />
              ) : previewData.type.startsWith("video/") ? (
                <video
                  src={previewData.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[75vh] rounded-lg drop-shadow-2xl"
                />
              ) : (
                <div className="text-center p-6 md:p-12 bg-bgMain/50 rounded-2xl border border-borderCol max-w-lg w-full">
                  <File
                    size={60}
                    className="mx-auto text-primary mb-4 md:mb-6 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] md:w-20 md:h-20"
                  />
                  <p className="text-white font-bold text-xl md:text-2xl mb-2">
                    Ready to Transfer
                  </p>
                  <p className="text-textMuted mb-6 md:mb-8 text-xs md:text-sm">
                    Browsers cannot natively preview Microsoft Office or Archive
                    files, but your file is intact and ready.
                  </p>

                  <a
                    href={previewData.url}
                    download={previewData.name}
                    className="inline-flex items-center justify-center gap-2 bg-primary py-2.5 px-6 md:py-3 md:px-8 rounded-xl font-bold text-sm md:text-base shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-1 transition-all"
                  >
                    <CloudDownload size={18} className="md:w-5 md:h-5" />
                    Download File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === RESPONSIVE ANIMATED NAVBAR === */}
      <nav
        className={`fixed z-50 left-0 right-0 mx-auto flex justify-between items-center backdrop-blur-xl transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isScrolled
            ? "top-2 md:top-4 w-[95%] max-w-6xl rounded-2xl md:rounded-3xl bg-bgMain/85 py-2 px-3 md:py-3 md:px-6 shadow-[0_20px_40px_rgba(0,0,0,0.6)] border border-primary/20"
            : "top-0 w-full max-w-full rounded-none bg-bgMain/60 py-3 px-4 md:py-5 md:px-8 border-b border-borderCol"
        }`}
      >
        <div className="flex items-center gap-2 md:gap-4">
          <img
            src="/logo.png"
            alt="FileShare Logo"
            className={`object-contain drop-shadow-[0_0_12px_rgba(139,92,246,0.6)] transition-all duration-700 ease-in-out ${isScrolled ? "w-8 h-8 md:w-10 md:h-10" : "w-10 h-10 md:w-14 md:h-14"}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
            }}
          />
          <span
            className={`font-extrabold tracking-tight transition-all duration-700 ease-in-out hidden sm:block ${isScrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"}`}
          >
            FileShare
          </span>
        </div>

        <div className="flex bg-inputBg p-1 md:p-1.5 rounded-lg md:rounded-xl border border-borderCol/50 shadow-inner">
          <button
            onClick={() => setTab("file")}
            className={`px-3 py-1.5 md:px-5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${tab === "file" ? "bg-surface shadow-md text-white" : "text-textMuted hover:text-white"}`}
          >
            File Share
          </button>
          <button
            onClick={() => setTab("code")}
            className={`px-3 py-1.5 md:px-5 md:py-2 rounded-md md:rounded-lg text-xs md:text-sm font-bold transition-all duration-300 ${tab === "code" ? "bg-surface shadow-md text-white" : "text-textMuted hover:text-white"}`}
          >
            Code Room
          </button>
        </div>

        <div
          className={`flex items-center gap-1.5 md:gap-2 px-2 py-1.5 md:px-4 md:py-1.5 rounded-full text-[10px] md:text-xs font-bold border backdrop-blur-sm transition-colors ${isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
        >
          {isConnected ? (
            <Wifi size={12} className="md:w-[14px] md:h-[14px]" />
          ) : (
            <WifiOff size={12} className="md:w-[14px] md:h-[14px]" />
          )}
          <span className="hidden lg:inline">
            {isConnected ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </nav>

      <main className="relative z-10 pt-28 md:pt-40 pb-12 px-4 md:px-6 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* === RESPONSIVE HERO SECTION === */}
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

        {tab === "file" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* SENDER PANEL */}
            <div className="bg-surface/70 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol shadow-2xl hover:border-primary/50 transition-all duration-500 group animate-fade-in-up hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_20px_rgba(139,92,246,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="text-primary w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                Send Assets
              </h2>
              <p className="text-textMuted text-xs md:text-sm mb-4 md:mb-6">
                Upload files to generate a secure one-time key.
              </p>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-upload").click()}
                className={`border-2 border-dashed rounded-2xl h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/drop ${isDragging ? "border-primary bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]" : "border-borderCol bg-inputBg/50 hover:border-primary hover:bg-primary/5"}`}
              >
                <input
                  id="file-upload"
                  type="file"
                  hidden
                  multiple
                  onChange={(e) =>
                    setFiles((prev) => [...prev, ...Array.from(e.target.files)])
                  }
                />
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-transform ${isDragging ? "bg-primary/30 scale-125" : "bg-borderCol/30 group-hover/drop:scale-110"}`}
                >
                  <span
                    className={`text-xl md:text-2xl ${isDragging ? "text-white" : "text-textMuted"}`}
                  >
                    +
                  </span>
                </div>
                <span className="text-textMuted text-xs md:text-sm font-medium">
                  Drag, Click or <span className="text-primary">Paste</span>
                </span>
              </div>

              {files.length > 0 && !roomCode && (
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => handlePreview(f, false)}
                      className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3 bg-inputBg/80 rounded-xl border border-borderCol/50 cursor-pointer hover:bg-surface hover:border-primary/50 transition-all group"
                      title="Click to preview"
                    >
                      {getFileIcon(f.type, "text-primary")}
                      <span className="text-xs md:text-sm truncate flex-1 font-medium group-hover:text-primary transition-colors">
                        {f.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles(files.filter((_, index) => index !== i));
                        }}
                        className="text-[10px] md:text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 md:px-2.5 rounded bg-red-400/10 hover:bg-red-400/20 transition-colors"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {roomCode ? (
                <div className="mt-6 md:mt-8 p-4 md:p-6 bg-inputBg/80 rounded-2xl border border-primary/30 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                  <p className="text-[10px] md:text-xs font-bold text-textMuted uppercase tracking-[0.1em] md:tracking-[0.2em] mb-2 md:mb-3">
                    Your Transfer Key
                  </p>
                  <div className="flex items-center justify-center gap-3 md:gap-4 mb-3 md:mb-4">
                    <p className="text-4xl md:text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                      {roomCode}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="p-1.5 md:p-2 hover:bg-surface rounded-lg transition-colors text-textMuted hover:text-white"
                      title="Copy Key"
                    >
                      {copied ? (
                        <CheckCircle2 className="text-emerald-500 w-5 h-5 md:w-6 md:h-6" />
                      ) : (
                        <Copy className="w-5 h-5 md:w-6 md:h-6" />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setRoomCode("");
                      setFiles([]);
                    }}
                    className="text-xs md:text-sm text-textMuted hover:text-white underline transition-colors"
                  >
                    Start New Transfer
                  </button>
                </div>
              ) : (
                files.length > 0 && (
                  <button
                    onClick={handleSend}
                    disabled={!isConnected || isEncrypting}
                    className="w-full mt-4 md:mt-6 bg-primary py-3 md:py-4 rounded-xl text-sm md:text-base font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isEncrypting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />{" "}
                        Encrypting...
                      </>
                    ) : (
                      "Generate Secure Key"
                    )}
                  </button>
                )
              )}
            </div>

            {/* RECEIVER PANEL */}
            <div
              className="bg-surface/70 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol shadow-2xl hover:border-secondary/50 transition-all duration-500 group animate-fade-in-up hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-[0_0_20px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CloudDownload className="text-secondary w-6 h-6 md:w-7 md:h-7" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                Receive Assets
              </h2>
              <p className="text-textMuted text-xs md:text-sm mb-4 md:mb-6">
                Enter the 6-digit secure key to establish connection.
              </p>

              <input
                type="text"
                maxLength="6"
                placeholder="000 000"
                className="w-full bg-inputBg/80 border border-borderCol rounded-2xl p-4 md:p-6 text-center text-2xl md:text-3xl font-mono focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none tracking-[8px] md:tracking-[12px] uppercase transition-all"
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button
                onClick={() =>
                  socket.emit("join_room", inputCode.toUpperCase())
                }
                disabled={!isConnected || inputCode.length !== 6}
                className="w-full mt-4 md:mt-6 bg-secondary py-3 md:py-4 rounded-xl text-sm md:text-base font-bold shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Connect & Download
              </button>

              {receivedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-[10px] md:text-xs font-bold text-textMuted uppercase mb-2">
                    Ready for Download
                  </p>
                  {receivedFiles.map((f, i) => {
                    const mimeType = f.fileData.substring(
                      5,
                      f.fileData.indexOf(";"),
                    );
                    return (
                      <div
                        key={i}
                        onClick={() => handlePreview(f, true)}
                        className="flex items-center justify-between p-2.5 md:p-3 bg-inputBg/80 rounded-xl text-xs md:text-sm border border-borderCol hover:border-secondary/50 hover:bg-secondary/5 transition-all cursor-pointer group/file"
                        title="Click to preview"
                      >
                        <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                          {getFileIcon(
                            mimeType,
                            "text-secondary shrink-0 w-4 h-4 md:w-5 md:h-5",
                          )}
                          <span className="truncate font-medium group-hover/file:text-secondary transition-colors">
                            {f.fileName}
                          </span>
                        </div>
                        <a
                          href={f.fileData}
                          download={f.fileName}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 md:p-2 bg-secondary/10 hover:bg-secondary text-secondary hover:text-white rounded-lg transition-colors shrink-0"
                          title="Download File"
                        >
                          <CloudDownload className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CODE ROOM TAB */}
        {tab === "code" && (
          <div className="animate-fade-in-up">
            {!isJoined ? (
              <div className="max-w-md mx-auto bg-surface/70 backdrop-blur-md p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-borderCol text-center shadow-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 md:mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Code2 className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
                  Dev Room
                </h3>
                <p className="text-textMuted text-xs md:text-sm mb-6 md:mb-8">
                  Real-time collaborative code editor.
                </p>
                <input
                  type="text"
                  placeholder="ENTER ROOM ID"
                  className="w-full bg-inputBg/80 border border-borderCol rounded-xl p-3 md:p-4 text-center font-mono mb-3 md:mb-4 text-sm md:text-base outline-none focus:border-amber-500 tracking-widest uppercase"
                  onChange={(e) => setCodeRoomId(e.target.value.toUpperCase())}
                  value={codeRoomId}
                />
                <button
                  onClick={() => {
                    if (codeRoomId) {
                      socket.emit("join_code_session", codeRoomId);
                      setIsJoined(true);
                    }
                  }}
                  disabled={!isConnected}
                  className="w-full bg-primary py-3 rounded-xl text-sm md:text-base font-bold mb-3 hover:-translate-y-1 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:transform-none"
                >
                  Join Room
                </button>
                <button
                  onClick={() => {
                    const newId = Math.random()
                      .toString(36)
                      .substring(2, 8)
                      .toUpperCase();
                    setCodeRoomId(newId);
                    socket.emit("join_code_session", newId);
                    setIsJoined(true);
                  }}
                  disabled={!isConnected}
                  className="text-xs md:text-sm text-primary font-bold hover:underline disabled:opacity-50"
                >
                  Create New Room
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-[65vh] md:h-[70vh] animate-fade-in-up">
                <div className="flex justify-between items-center mb-3 md:mb-4 px-1 md:px-2">
                  <div className="flex items-center gap-2 md:gap-3">
                    <span className="text-textMuted text-xs md:text-sm font-bold">
                      SESSION:
                    </span>
                    <span className="bg-amber-500/10 text-amber-500 px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-xs md:text-base font-mono font-bold tracking-widest border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      {codeRoomId}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsJoined(false);
                      setCodeRoomId("");
                    }}
                    className="text-red-400 text-xs md:text-sm font-bold hover:text-red-300 bg-red-400/10 px-3 py-1 md:px-4 md:py-1.5 rounded-lg transition-colors border border-red-400/20"
                  >
                    EXIT
                  </button>
                </div>
                <textarea
                  value={code}
                  onChange={(e) => {
                    const newCode = e.target.value;
                    setCode(newCode);
                    socket.emit("send_code_update", {
                      roomCode: codeRoomId,
                      code: newCode,
                    });
                  }}
                  className="w-full flex-1 bg-surface/80 backdrop-blur-md border border-borderCol rounded-2xl md:rounded-3xl p-4 md:p-8 font-mono text-xs md:text-[15px] leading-relaxed outline-none focus:border-amber-500/50 resize-none shadow-2xl custom-scrollbar"
                  spellCheck="false"
                  placeholder="// Start typing your code here..."
                ></textarea>
              </div>
            )}
          </div>
        )}

        {/* FEATURES SECTION */}
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

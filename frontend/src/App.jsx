import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import {
  CloudUpload,
  CloudDownload,
  Globe,
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
} from "lucide-react";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
  withCredentials: true,
});

// --- ULTRA-SMOOTH PATTERNED GRID COMPONENT ---
const InteractiveGrid = React.memo(() => {
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });

  useEffect(() => {
    const calculateGrid = () => {
      const blockSize = 50;
      const cols = Math.ceil(window.innerWidth / blockSize);
      const rows = Math.ceil(window.innerHeight / blockSize);
      setGridSize({ cols, rows });
    };

    calculateGrid();
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculateGrid, 200);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseOver = useCallback(
    (e) => {
      const target = e.target;
      if (target.classList.contains("grid-block")) {
        const index = parseInt(target.dataset.index);
        const col = index % gridSize.cols;
        const row = Math.floor(index / gridSize.cols);

        const hue = (col * 4 + row * 4) % 360;
        const neonColor = `hsl(${hue}, 90%, 60%)`;

        target.style.transitionDuration = "0s";
        target.style.backgroundColor = neonColor;
        target.style.boxShadow = `0 0 15px ${neonColor}, 0 0 30px ${neonColor}`;
        target.style.opacity = "0.6";

        setTimeout(() => {
          if (target) {
            target.style.transitionDuration = "2000ms";
            target.style.backgroundColor = "transparent";
            target.style.boxShadow = "none";
            target.style.opacity = "1";
          }
        }, 50);
      }
    },
    [gridSize.cols],
  );

  return (
    <div
      className="fixed inset-0 z-0 grid w-full h-full bg-bgMain overflow-hidden opacity-70 pointer-events-auto"
      style={{
        gridTemplateColumns: `repeat(${gridSize.cols}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize.rows}, 1fr)`,
      }}
      onMouseOver={handleMouseOver}
    >
      {Array.from({ length: gridSize.cols * gridSize.rows }).map((_, i) => (
        <div
          key={i}
          data-index={i}
          className="grid-block border-[0.5px] border-white/[0.03] transition-all ease-out will-change-[background-color,box-shadow,opacity]"
        />
      ))}
    </div>
  );
});

export default function App() {
  const [tab, setTab] = useState("file");
  const [isConnected, setIsConnected] = useState(socket.connected);

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

  useEffect(() => {
    const handlePaste = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;
      const pastedFiles = [];
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            const ext = file.type.split("/")[1] || "bin";
            const newFile = new File(
              [file],
              `Pasted-Asset-${Date.now()}.${ext}`,
              { type: file.type },
            );
            pastedFiles.push(newFile);
          }
        }
      }
      if (pastedFiles.length > 0) {
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

  return (
    <div className="min-h-screen bg-bgMain text-white font-sans selection:bg-primary/30 relative flex flex-col overflow-x-hidden">
      <InteractiveGrid />

      <nav className="relative z-20 w-full bg-bgMain/60 backdrop-blur-xl border-b border-borderCol p-5 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2.5 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <Globe size={22} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">
            FileShare
          </span>
        </div>

        <div className="flex bg-inputBg p-1.5 rounded-xl border border-borderCol/50 shadow-inner">
          <button
            onClick={() => setTab("file")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${tab === "file" ? "bg-surface shadow-md text-white" : "text-textMuted hover:text-white"}`}
          >
            File Share
          </button>
          <button
            onClick={() => setTab("code")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${tab === "code" ? "bg-surface shadow-md text-white" : "text-textMuted hover:text-white"}`}
          >
            Code Room
          </button>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-sm transition-colors ${isConnected ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}
        >
          {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isConnected ? "ONLINE" : "OFFLINE"}
        </div>
      </nav>

      <main className="relative z-10 pt-16 pb-12 px-6 max-w-6xl mx-auto w-full flex-1 pointer-events-none flex flex-col">
        <div className="text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight pointer-events-auto">
            Share without{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Limits.
            </span>
          </h1>
          <p className="text-textMuted max-w-lg mx-auto text-lg pointer-events-auto">
            Secure, anonymous, peer-to-peer data infrastructure.
          </p>
        </div>

        {tab === "file" && (
          <div className="grid md:grid-cols-2 gap-8 pointer-events-auto">
            {/* SENDER PANEL */}
            <div className="bg-surface/70 backdrop-blur-md p-8 rounded-[32px] border border-borderCol shadow-2xl hover:border-primary/50 transition-all duration-500 group animate-fade-in-up hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(139,92,246,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CloudUpload className="text-primary" size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Send Assets</h2>
              <p className="text-textMuted text-sm mb-6">
                Upload files to generate a secure one-time key.
              </p>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-upload").click()}
                className={`border-2 border-dashed rounded-2xl h-44 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/drop ${isDragging ? "border-primary bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]" : "border-borderCol bg-inputBg/50 hover:border-primary hover:bg-primary/5"}`}
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
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform ${isDragging ? "bg-primary/30 scale-125" : "bg-borderCol/30 group-hover/drop:scale-110"}`}
                >
                  <span
                    className={`text-2xl ${isDragging ? "text-white" : "text-textMuted"}`}
                  >
                    +
                  </span>
                </div>
                <span className="text-textMuted text-sm font-medium">
                  Drag, Click or <span className="text-primary">Paste</span>
                </span>
              </div>

              {files.length > 0 && !roomCode && (
                <div className="mt-4 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-inputBg/80 rounded-xl border border-borderCol/50"
                    >
                      <File size={16} className="text-primary" />
                      <span className="text-sm truncate flex-1">{f.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles(files.filter((_, index) => index !== i));
                        }}
                        className="text-xs text-red-400 hover:text-red-300 font-bold px-2 rounded hover:bg-red-400/10 transition-colors"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {roomCode ? (
                <div className="mt-8 p-6 bg-inputBg/80 rounded-2xl border border-primary/30 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
                  <p className="text-xs font-bold text-textMuted uppercase tracking-[0.2em] mb-3">
                    Your Transfer Key
                  </p>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <p className="text-5xl font-mono font-black text-white tracking-widest drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                      {roomCode}
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-surface rounded-lg transition-colors text-textMuted hover:text-white"
                      title="Copy Key"
                    >
                      {copied ? (
                        <CheckCircle2 className="text-emerald-500" size={24} />
                      ) : (
                        <Copy size={24} />
                      )}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setRoomCode("");
                      setFiles([]);
                    }}
                    className="text-sm text-textMuted hover:text-white underline transition-colors"
                  >
                    Start New Transfer
                  </button>
                </div>
              ) : (
                files.length > 0 && (
                  <button
                    onClick={handleSend}
                    disabled={!isConnected || isEncrypting}
                    className="w-full mt-6 bg-primary py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isEncrypting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />{" "}
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
              className="bg-surface/70 backdrop-blur-md p-8 rounded-[32px] border border-borderCol shadow-2xl hover:border-secondary/50 transition-all duration-500 group animate-fade-in-up hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(236,72,153,0.1)] group-hover:scale-110 transition-transform duration-300">
                <CloudDownload className="text-secondary" size={28} />
              </div>
              <h2 className="text-2xl font-bold mb-2">Receive Assets</h2>
              <p className="text-textMuted text-sm mb-6">
                Enter the 6-digit secure key to establish connection.
              </p>

              <input
                type="text"
                maxLength="6"
                placeholder="000 000"
                className="w-full bg-inputBg/80 border border-borderCol rounded-2xl p-6 text-center text-3xl font-mono focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none tracking-[12px] uppercase transition-all"
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button
                onClick={() =>
                  socket.emit("join_room", inputCode.toUpperCase())
                }
                disabled={!isConnected || inputCode.length !== 6}
                className="w-full mt-6 bg-secondary py-4 rounded-xl font-bold shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Connect & Download
              </button>

              {receivedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="text-xs font-bold text-textMuted uppercase mb-2">
                    Ready for Download
                  </p>
                  {receivedFiles.map((f, i) => (
                    <a
                      key={i}
                      href={f.fileData}
                      download={f.fileName}
                      className="flex items-center justify-between p-4 bg-inputBg/80 rounded-xl text-sm border border-borderCol hover:border-secondary/50 hover:bg-secondary/5 transition-all group/file"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File size={16} className="text-secondary shrink-0" />
                        <span className="truncate font-medium">
                          {f.fileName}
                        </span>
                      </div>
                      <CloudDownload
                        size={18}
                        className="text-secondary opacity-0 group-hover/file:opacity-100 transition-opacity shrink-0"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CODE ROOM TAB */}
        {tab === "code" && (
          <div className="animate-fade-in-up pointer-events-auto">
            {!isJoined ? (
              <div className="max-w-md mx-auto bg-surface/70 backdrop-blur-md p-10 rounded-[40px] border border-borderCol text-center shadow-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                  <Code2 size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Dev Room</h3>
                <p className="text-textMuted text-sm mb-8">
                  Real-time collaborative code editor.
                </p>
                <input
                  type="text"
                  placeholder="ENTER ROOM ID"
                  className="w-full bg-inputBg/80 border border-borderCol rounded-xl p-4 text-center font-mono mb-4 outline-none focus:border-amber-500 tracking-widest uppercase"
                  onChange={(e) => setCodeRoomId(e.target.value)}
                />
                <button
                  onClick={() => {
                    if (codeRoomId) {
                      socket.emit(
                        "join_code_session",
                        codeRoomId.toUpperCase(),
                      );
                      setIsJoined(true);
                    }
                  }}
                  disabled={!isConnected}
                  className="w-full bg-primary py-3 rounded-xl font-bold mb-3 hover:-translate-y-1 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:transform-none"
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
                  className="text-sm text-primary font-bold hover:underline disabled:opacity-50"
                >
                  Create New Room
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-[70vh] animate-fade-in-up">
                <div className="flex justify-between items-center mb-4 px-2">
                  <div className="flex items-center gap-3">
                    <span className="text-textMuted text-sm font-bold">
                      SESSION ID:
                    </span>
                    <span className="bg-amber-500/10 text-amber-500 px-4 py-1.5 rounded-lg font-mono font-bold tracking-widest border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                      {codeRoomId}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsJoined(false);
                      setCodeRoomId("");
                    }}
                    className="text-red-400 text-sm font-bold hover:text-red-300 bg-red-400/10 px-4 py-1.5 rounded-lg transition-colors border border-red-400/20"
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
                  className="w-full flex-1 bg-surface/80 backdrop-blur-md border border-borderCol rounded-3xl p-8 font-mono text-[15px] leading-relaxed outline-none focus:border-amber-500/50 resize-none shadow-2xl custom-scrollbar"
                  spellCheck="false"
                  placeholder="// Start typing your code here..."
                ></textarea>
              </div>
            )}
          </div>
        )}

        {/* --- NEW FEATURES SECTION --- */}
        <div
          className="mt-auto pt-32 pb-8 grid grid-cols-1 md:grid-cols-3 gap-6 pointer-events-auto animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* Feature 1 */}
          <div className="bg-surface/60 backdrop-blur-md p-8 rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Zap className="text-primary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Lightning Fast
            </h3>
            <p className="text-textMuted text-sm leading-relaxed">
              Direct peer-to-peer WebSocket infrastructure ensures instant,
              unthrottled data movement across devices.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-surface/60 backdrop-blur-md p-8 rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-secondary/50 hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] group">
            <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <ShieldCheck className="text-secondary" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Zero Logs Policy
            </h3>
            <p className="text-textMuted text-sm leading-relaxed">
              Absolute privacy. No accounts required, and data is permanently
              wiped from memory the moment a transfer completes.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-surface/60 backdrop-blur-md p-8 rounded-[32px] border border-borderCol transition-all duration-500 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] group">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Infinity className="text-emerald-500" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">
              Unrestricted Limits
            </h3>
            <p className="text-textMuted text-sm leading-relaxed">
              Share massive datasets, high-res videos, or entire project folders
              seamlessly via drag-and-drop or clipboard paste.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-20 mt-auto w-full border-t border-borderCol bg-bgMain/60 backdrop-blur-xl py-6 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-textMuted text-sm">
            © 2026 FileShare. Secure File Infrastructure.
          </p>

          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Madhav7871"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textMuted hover:text-primary transition-colors hover:drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]"
            >
              <Github size={22} />
            </a>
            <a
              href="https://www.linkedin.com/in/madhav-kalra-807252242/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-textMuted hover:text-secondary transition-colors hover:drop-shadow-[0_0_10px_rgba(236,72,153,0.8)]"
            >
              <Linkedin size={22} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  CloudUpload,
  CloudDownload,
  Copy,
  CheckCircle2,
  File,
  Loader2,
  Image as ImageIcon,
  FileText,
  Film,
  X,
} from "lucide-react";

export default function FileShare({ socket, isConnected }) {
  // File Share State
  const [files, setFiles] = useState([]);
  const [roomCode, setRoomCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isJoiningFileRoom, setIsJoiningFileRoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
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
      }
    };
    window.addEventListener("paste", handlePaste);

    // Socket listeners specific to FileShare
    const onRoomCreated = (code) => {
      setRoomCode(code);
      setIsEncrypting(false);
    };

    const onFileReceived = (data) => {
      setReceivedFiles(data.files);
      setIsJoiningFileRoom(false);
    };

    const onError = () => {
      setIsEncrypting(false);
      setIsJoiningFileRoom(false);
    };

    socket.on("room_created", onRoomCreated);
    socket.on("file_received", onFileReceived);
    socket.on("error", onError);

    return () => {
      window.removeEventListener("paste", handlePaste);
      socket.off("room_created", onRoomCreated);
      socket.off("file_received", onFileReceived);
      socket.off("error", onError);
    };
  }, [socket]);

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

  const handleJoinFileRoom = () => {
    if (isConnected && inputCode.length === 6) {
      setIsJoiningFileRoom(true);
      socket.emit("join_room", inputCode);
    }
  };

  return (
    <>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* SENDER PANEL */}
        <div className="bg-surface/70 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol shadow-2xl hover:border-primary/50 transition-all duration-500 group hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]">
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
            className={`border-2 border-dashed rounded-2xl h-36 md:h-44 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group/drop ${
              isDragging
                ? "border-primary bg-primary/20 shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                : "border-borderCol bg-inputBg/50 hover:border-primary hover:bg-primary/5"
            }`}
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
              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mb-2 md:mb-3 transition-transform ${
                isDragging
                  ? "bg-primary/30 scale-125"
                  : "bg-borderCol/30 group-hover/drop:scale-110"
              }`}
            >
              <span
                className={`text-xl md:text-2xl ${isDragging ? "text-white" : "text-textMuted"}`}
              >
                +
              </span>
            </div>
            <span className="text-textMuted text-xs md:text-sm font-medium">
              Drag, Click or <span className="text-primary">Paste</span>your
              files here
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
                    <Loader2 className="animate-spin" size={18} /> Encrypting...
                  </>
                ) : (
                  "Generate Secure Key"
                )}
              </button>
            )
          )}
        </div>

        {/* RECEIVER PANEL */}
        <div className="bg-surface/70 backdrop-blur-md p-6 md:p-8 rounded-3xl md:rounded-[32px] border border-borderCol shadow-2xl hover:border-secondary/50 transition-all duration-500 group hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]">
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
            maxLength="7"
            placeholder="000 000"
            className="w-full bg-inputBg/80 border border-borderCol rounded-2xl p-4 md:p-6 text-center text-2xl md:text-3xl font-mono focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none tracking-[8px] md:tracking-[12px] uppercase transition-all"
            onChange={(e) =>
              setInputCode(e.target.value.replace(/\s/g, "").toUpperCase())
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleJoinFileRoom();
              }
            }}
          />
          <button
            onClick={handleJoinFileRoom}
            disabled={
              !isConnected || inputCode.length !== 6 || isJoiningFileRoom
            }
            className="w-full mt-4 md:mt-6 bg-secondary py-3 md:py-4 rounded-xl text-sm md:text-base font-bold shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex justify-center items-center gap-2"
          >
            {isJoiningFileRoom ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Connecting...
              </>
            ) : (
              "Connect & Download"
            )}
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
    </>
  );
}

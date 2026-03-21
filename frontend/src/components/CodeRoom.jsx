import React, { useState, useEffect, useRef } from "react";
import { Code2, Loader2, Copy, CheckCircle2 } from "lucide-react";

export default function CodeRoom({ socket, isConnected }) {
  // Code Room State
  const [codeRoomId, setCodeRoomId] = useState("");
  const [code, setCode] = useState("// Start coding...");
  const [isJoined, setIsJoined] = useState(false);
  const [isJoiningCodeRoom, setIsJoiningCodeRoom] = useState(false);
  const [codeRoomCopied, setCodeRoomCopied] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const onCodeUpdate = (newCode) => {
      setCode((prevCode) => {
        if (prevCode === newCode) return prevCode;
        if (
          textareaRef.current &&
          document.activeElement === textareaRef.current
        ) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.setSelectionRange(start, end);
            }
          }, 0);
        }
        return newCode;
      });
    };

    const onSessionCreated = (roomId) => {
      setCodeRoomId(roomId);
      setIsJoined(true);
    };

    const onSessionJoined = () => {
      setIsJoined(true);
      setIsJoiningCodeRoom(false);
    };

    const onError = () => {
      setIsJoiningCodeRoom(false);
    };

    socket.on("code_update", onCodeUpdate);
    socket.on("code_session_created", onSessionCreated);
    socket.on("code_session_joined", onSessionJoined);
    socket.on("error", onError);

    return () => {
      socket.off("code_update", onCodeUpdate);
      socket.off("code_session_created", onSessionCreated);
      socket.off("code_session_joined", onSessionJoined);
      socket.off("error", onError);
    };
  }, [socket]);

  const handleJoinCodeRoom = () => {
    if (isConnected && codeRoomId) {
      setIsJoiningCodeRoom(true);
      socket.emit("join_code_session", codeRoomId);
    }
  };

  return (
    <div>
      {!isJoined ? (
        <div className="max-w-md mx-auto bg-surface/70 backdrop-blur-md p-6 md:p-10 rounded-3xl md:rounded-[40px] border border-borderCol text-center shadow-2xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-4 md:mb-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            <Code2 className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">
            Code Room.
          </h3>
          <p className="text-textMuted text-xs md:text-sm mb-6 md:mb-8">
            Real-time collaborative code editor.
          </p>
          <input
            type="text"
            placeholder="ENTER ROOM ID"
            className="w-full bg-inputBg/80 border border-borderCol rounded-xl p-3 md:p-4 text-center font-mono mb-3 md:mb-4 text-sm md:text-base outline-none focus:border-amber-500 tracking-widest uppercase"
            onChange={(e) =>
              setCodeRoomId(e.target.value.replace(/\s/g, "").toUpperCase())
            }
            value={codeRoomId}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleJoinCodeRoom();
              }
            }}
          />
          <button
            onClick={handleJoinCodeRoom}
            disabled={!isConnected || !codeRoomId || isJoiningCodeRoom}
            className="w-full bg-primary py-3 rounded-xl text-sm md:text-base font-bold mb-3 hover:-translate-y-1 transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:transform-none flex justify-center items-center gap-2"
          >
            {isJoiningCodeRoom ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Joining...
              </>
            ) : (
              "Join Room"
            )}
          </button>
          <button
            onClick={() => {
              const newId = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
              socket.emit("create_code_session", newId);
            }}
            disabled={!isConnected}
            className="text-xs md:text-sm text-primary font-bold hover:underline disabled:opacity-50"
          >
            Create New Room
          </button>
        </div>
      ) : (
        <div className="flex flex-col h-[65vh] md:h-[70vh]">
          <div className="flex justify-between items-center mb-3 md:mb-4 px-1 md:px-2">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-textMuted text-xs md:text-sm font-bold">
                SESSION:
              </span>
              <div className="flex items-center gap-2 bg-amber-500/10 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <span className="text-amber-500 text-xs md:text-base font-mono font-bold tracking-widest">
                  {codeRoomId}
                </span>
                <div className="w-[1px] h-4 bg-amber-500/30 mx-1"></div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeRoomId);
                    setCodeRoomCopied(true);
                    setTimeout(() => setCodeRoomCopied(false), 2000);
                  }}
                  className="text-amber-500/70 hover:text-amber-500 hover:scale-110 transition-all focus:outline-none"
                  title="Copy Session ID"
                >
                  {codeRoomCopied ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                socket.emit("leave_code_session", codeRoomId);
                setIsJoined(false);
                setCodeRoomId("");
                setCode("// Start coding...");
              }}
              className="text-red-400 text-xs md:text-sm font-bold hover:text-red-300 bg-red-400/10 px-3 py-1 md:px-4 md:py-1.5 rounded-lg transition-colors border border-red-400/20"
            >
              EXIT
            </button>
          </div>
          <textarea
            ref={textareaRef}
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
  );
}

import React, { useEffect, useRef, useState } from "react";

const DinoGame = ({ isPaused }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winnerData, setWinnerData] = useState(null); // { winner: 'X' | 'O' | 'Draw', line: [] }
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  // === AUDIO SETUP ===
  const passAudioRef = useRef(
    typeof Audio !== "undefined" ? new Audio("/pass.mp3") : null,
  );
  const crashAudioRef = useRef(
    typeof Audio !== "undefined" ? new Audio("/crash.mp3") : null,
  );

  const playSound = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // === WINNING LOGIC ===
  const checkWinner = (squares) => {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // cols
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (
        squares[a] &&
        squares[a] === squares[b] &&
        squares[a] === squares[c]
      ) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    if (!squares.includes(null)) return { winner: "Draw", line: [] };
    return null;
  };

  // === MEDIUM AI LOGIC ===
  const getBestMove = (squares) => {
    const emptySpots = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    // 1. Check if AI can win on this move
    for (let i of emptySpots) {
      const testBoard = [...squares];
      testBoard[i] = "O";
      if (checkWinner(testBoard)?.winner === "O") return i;
    }

    // 2. Check if Player is about to win and BLOCK them
    for (let i of emptySpots) {
      const testBoard = [...squares];
      testBoard[i] = "X";
      if (checkWinner(testBoard)?.winner === "X") return i;
    }

    // 3. Take the center if it's available
    if (emptySpots.includes(4)) return 4;

    // 4. Otherwise, pick a random spot
    return emptySpots[Math.floor(Math.random() * emptySpots.length)];
  };

  // === GAMEPLAY EFFECTS ===
  useEffect(() => {
    const result = checkWinner(board);

    if (result && !winnerData) {
      setWinnerData(result);
      if (result.winner === "X") {
        setScores((s) => ({ ...s, player: s.player + 1 }));
      } else if (result.winner === "O") {
        setScores((s) => ({ ...s, ai: s.ai + 1 }));
        playSound(crashAudioRef); // Play crash sound when AI wins
      }
      return;
    }

    // AI Turn
    if (!isPlayerTurn && !result && !isPaused) {
      const timer = setTimeout(() => {
        const move = getBestMove(board);
        if (move !== undefined) {
          const newBoard = [...board];
          newBoard[move] = "O";
          setBoard(newBoard);
          playSound(passAudioRef);
          setIsPlayerTurn(true);
        }
      }, 600); // 0.6s delay makes it feel like the AI is "thinking"
      return () => clearTimeout(timer);
    }
  }, [board, isPlayerTurn, winnerData, isPaused]);

  // === USER ACTIONS ===
  const handleCellClick = (index) => {
    if (board[index] || winnerData || !isPlayerTurn || isPaused) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    playSound(passAudioRef);
    setIsPlayerTurn(false);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinnerData(null);
    setIsPlayerTurn(true);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto select-none p-4 relative group">
      {/* Header / Scoreboard */}
      <div className="flex justify-between w-full px-4 mb-6 font-mono text-sm md:text-base text-primary font-bold tracking-widest bg-black/40 p-3 rounded-lg border border-borderCol">
        <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
          YOU (X): {scores.player}
        </span>
        <span className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
          AI (O): {scores.ai}
        </span>
      </div>

      {/* Game Board */}
      <div
        className={`grid grid-cols-3 gap-2 sm:gap-3 bg-black/50 p-3 sm:p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all border ${
          isPaused
            ? "border-emerald-500/50 opacity-80"
            : "border-borderCol group-hover:border-primary/50"
        }`}
      >
        {board.map((cell, index) => {
          const isWinningCell = winnerData?.line?.includes(index);

          return (
            <button
              key={index}
              onClick={() => handleCellClick(index)}
              disabled={!!cell || !!winnerData || !isPlayerTurn || isPaused}
              className={`w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center text-4xl sm:text-6xl font-bold rounded-xl transition-all duration-300
                ${!cell && !winnerData && isPlayerTurn && !isPaused ? "hover:bg-white/10 cursor-pointer" : "cursor-default"}
                ${cell ? "bg-white/5" : "bg-black/40"}
                ${isWinningCell ? "bg-white/20 scale-105" : ""}
              `}
            >
              {cell === "X" && (
                <span className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] animate-pulse">
                  X
                </span>
              )}
              {cell === "O" && (
                <span className="text-purple-500 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)] animate-pulse">
                  O
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Status & Restart overlay */}
      <div className="h-16 mt-6 flex flex-col items-center justify-center w-full">
        {winnerData ? (
          <div className="flex flex-col items-center animate-fade-in">
            <span
              className={`text-xl sm:text-2xl font-bold font-mono tracking-wider mb-2 ${
                winnerData.winner === "X"
                  ? "text-emerald-400"
                  : winnerData.winner === "O"
                    ? "text-red-400"
                    : "text-gray-400"
              }`}
            >
              {winnerData.winner === "X"
                ? "YOU WIN!"
                : winnerData.winner === "O"
                  ? "AI WINS!"
                  : "DRAW!"}
            </span>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 rounded-lg font-mono text-sm tracking-widest transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        ) : isPaused ? (
          <span className="text-gray-400 font-mono tracking-widest animate-pulse">
            SYSTEM PAUSED
          </span>
        ) : (
          <span
            className={`font-mono tracking-widest transition-colors ${
              isPlayerTurn ? "text-emerald-400" : "text-purple-500"
            }`}
          >
            {isPlayerTurn ? ">> YOUR TURN" : "AI IS THINKING..."}
          </span>
        )}
      </div>
    </div>
  );
};

export default DinoGame;

import React, { useEffect, useRef, useState } from "react";

const DinoGame = ({ isPaused }) => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winnerData, setWinnerData] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  // Difficulty & Dropdown state
  const [difficulty, setDifficulty] = useState("medium");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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

  const checkWinSimple = (squares) => {
    const result = checkWinner(squares);
    return result ? result.winner : null;
  };

  // === HARD AI LOGIC (MINIMAX) ===
  const minimax = (newBoard, player) => {
    const emptySpots = newBoard
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);
    const winner = checkWinSimple(newBoard);

    if (winner === "X") return { score: -10 };
    if (winner === "O") return { score: 10 };
    if (emptySpots.length === 0) return { score: 0 };

    const moves = [];
    for (let i = 0; i < emptySpots.length; i++) {
      const move = {};
      move.index = emptySpots[i];
      newBoard[emptySpots[i]] = player;

      if (player === "O") {
        const result = minimax(newBoard, "X");
        move.score = result.score;
      } else {
        const result = minimax(newBoard, "O");
        move.score = result.score;
      }

      newBoard[emptySpots[i]] = null;
      moves.push(move);
    }

    let bestMove;
    if (player === "O") {
      let bestScore = -10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score > bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    } else {
      let bestScore = 10000;
      for (let i = 0; i < moves.length; i++) {
        if (moves[i].score < bestScore) {
          bestScore = moves[i].score;
          bestMove = i;
        }
      }
    }
    return moves[bestMove];
  };

  // === DYNAMIC AI LOGIC ===
  const getBestMove = (squares) => {
    const emptySpots = squares
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    if (difficulty === "easy") {
      return emptySpots[Math.floor(Math.random() * emptySpots.length)];
    }

    if (difficulty === "hard") {
      return minimax([...squares], "O").index;
    }

    for (let i of emptySpots) {
      const testBoard = [...squares];
      testBoard[i] = "O";
      if (checkWinner(testBoard)?.winner === "O") return i;
    }
    for (let i of emptySpots) {
      const testBoard = [...squares];
      testBoard[i] = "X";
      if (checkWinner(testBoard)?.winner === "X") return i;
    }
    if (emptySpots.includes(4)) return 4;
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
        playSound(crashAudioRef);
      }
      return;
    }

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
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [board, isPlayerTurn, winnerData, isPaused, difficulty]);

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

  const changeDifficulty = (level) => {
    setDifficulty(level);
    setIsDropdownOpen(false);
    resetGame();
  };

  return (
    // Changed to a side-by-side flex layout (md:flex-row) and increased max width to accommodate both columns
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-6 md:gap-8 w-full max-w-[600px] mx-auto select-none p-2 relative group">
      {/* Invisible overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* LEFT COLUMN: Game Board */}
      <div className="flex flex-col items-center z-0">
        <div
          className={`grid grid-cols-3 gap-2 sm:gap-2.5 bg-black/50 p-3 sm:p-4 rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.6)] transition-all border ${
            isPaused
              ? "border-emerald-500/50 opacity-80"
              : "border-gray-800 group-hover:border-purple-500/30"
          }`}
        >
          {board.map((cell, index) => {
            const isWinningCell = winnerData?.line?.includes(index);

            return (
              <button
                key={index}
                onClick={() => handleCellClick(index)}
                disabled={!!cell || !!winnerData || !isPlayerTurn || isPaused}
                className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-4xl sm:text-5xl font-bold rounded-lg transition-all duration-300
                  ${!cell && !winnerData && isPlayerTurn && !isPaused ? "hover:bg-white/10 cursor-pointer" : "cursor-default"}
                  ${cell ? "bg-white/5" : "bg-black/40"}
                  ${isWinningCell ? "bg-white/20 scale-105 ring-2 ring-white/50" : ""}
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
      </div>

      {/* RIGHT COLUMN: Controls Panel */}
      <div className="flex flex-col w-full max-w-[220px] gap-4 z-20">
        {/* Sleek Animated Dropdown Menu */}
        <div className="relative w-full">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center justify-between w-full px-4 py-3 bg-black/60 border rounded-lg font-mono text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
              isDropdownOpen
                ? "border-purple-500 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                : "border-gray-700 text-gray-400 hover:border-purple-500/50 hover:text-purple-300"
            }`}
          >
            <span>Level: {difficulty}</span>
            <svg
              className={`w-3.5 h-3.5 transform transition-transform duration-300 ${isDropdownOpen ? "rotate-180" : "rotate-0"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Sliding Options */}
          <div
            className={`absolute top-full mt-1.5 w-full bg-black/90 border border-gray-800 rounded-lg overflow-hidden transition-all duration-300 transform origin-top backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] ${
              isDropdownOpen
                ? "opacity-100 scale-y-100 translate-y-0"
                : "opacity-0 scale-y-0 -translate-y-4 pointer-events-none"
            }`}
          >
            {["easy", "medium", "hard"].map((level) => (
              <button
                key={level}
                onClick={() => changeDifficulty(level)}
                className={`w-full text-left px-4 py-2.5 font-mono text-xs uppercase tracking-widest transition-colors duration-200 ${
                  difficulty === level
                    ? "bg-purple-500/20 text-purple-400 border-l-2 border-purple-500"
                    : "text-gray-500 hover:bg-white/5 hover:text-gray-300 border-l-2 border-transparent"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Scoreboard (Stacked vertically for side panel) */}
        <div className="flex flex-col gap-3 font-mono text-xs md:text-sm text-white font-bold tracking-widest bg-black/40 p-4 rounded-lg border border-gray-800">
          <div className="flex justify-between items-center w-full">
            <span className="text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]">
              YOU (X)
            </span>
            <span className="text-emerald-400">{scores.player}</span>
          </div>
          <div className="w-full h-px bg-gray-800/60 rounded"></div>
          <div className="flex justify-between items-center w-full">
            <span className="text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
              AI (O)
            </span>
            <span className="text-purple-500">{scores.ai}</span>
          </div>
        </div>

        {/* Status / Play Again Area */}
        <div className="h-20 mt-2 flex flex-col items-center justify-center w-full bg-black/20 rounded-lg border border-gray-800/50 p-3">
          {winnerData ? (
            <div className="flex flex-col items-center animate-fade-in w-full">
              <span
                className={`text-lg font-bold font-mono tracking-wider mb-2 ${
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
                className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-md font-mono text-xs tracking-widest transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                PLAY AGAIN
              </button>
            </div>
          ) : isPaused ? (
            <span className="text-gray-400 font-mono text-xs tracking-widest animate-pulse text-center">
              SYSTEM PAUSED
            </span>
          ) : (
            <span
              className={`font-mono text-xs tracking-widest transition-colors text-center ${
                isPlayerTurn ? "text-emerald-400" : "text-purple-500"
              }`}
            >
              {isPlayerTurn ? ">> YOUR TURN" : "AI IS THINKING..."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default DinoGame;

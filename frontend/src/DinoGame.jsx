import React, { useEffect, useRef, useState } from "react";

const DinoGame = ({ isPaused }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem("neonRunnerHighScore")) || 0,
  );
  const [gameOver, setGameOver] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Use a ref to track the pause state dynamically inside the game loop without re-triggering the useEffect
  const isPausedRef = useRef(isPaused);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;

    // === HD CANVAS SCALING ===
    const isMobile = window.innerWidth < 768;
    const logicalWidth = isMobile ? 400 : 800;
    const logicalHeight = isMobile ? 300 : 250;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    ctx.scale(dpr, dpr);

    // === PROPER DINO PHYSICS & CONSTANTS ===
    const GRAVITY = 0.65; // Snappier gravity
    const JUMP_POWER = isMobile ? -11 : -12; // Precise jump height
    const GAME_SPEED_START = isMobile ? 5 : 6;
    const groundY = isMobile ? 240 : 200;

    // Entity States
    let gameSpeed = GAME_SPEED_START;
    let isJumping = false;
    let frames = 0;
    let obstacles = [];
    let currentScore = 0;
    let gameRunning = hasStarted && !gameOver;
    let framesSinceLastSpawn = 0;

    // The Neon Runner (Man)
    const player = {
      x: isMobile ? 40 : 70,
      y: groundY - 40,
      w: 24,
      h: 40,
      dy: 0,
    };

    // Jump Logic
    const jump = () => {
      if (isPausedRef.current) return; // Completely prevent jumping while paused!

      if (!gameRunning && !hasStarted) {
        setHasStarted(true);
        setGameOver(false);
        obstacles = [];
        currentScore = 0;
        framesSinceLastSpawn = 0;
        gameSpeed = GAME_SPEED_START;
      } else if (gameOver) {
        setHasStarted(true);
        setGameOver(false);
        obstacles = [];
        currentScore = 0;
        setScore(0);
        framesSinceLastSpawn = 0;
        gameSpeed = GAME_SPEED_START;
        player.y = groundY - player.h;
        player.dy = 0;
      } else if (!isJumping) {
        player.dy = JUMP_POWER;
        isJumping = true;
      }
    };

    // Input Listeners
    const handleKeyDown = (e) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };

    const handleTap = (e) => {
      if (e.target.tagName === "BUTTON" || e.target.tagName === "INPUT") return;
      e.preventDefault();
      jump();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    container.addEventListener("touchstart", handleTap, { passive: false });
    container.addEventListener("mousedown", handleTap);

    // Spawn Obstacles
    const spawnObstacle = () => {
      const isLarge = Math.random() > 0.5;
      const height = isLarge ? (isMobile ? 35 : 45) : isMobile ? 25 : 30;
      const width = isLarge ? 20 : 16;

      obstacles.push({
        x: logicalWidth,
        y: groundY - height,
        w: width,
        h: height,
        color: "#EC4899", // Pink Neon Spikes
      });
    };

    // Draw the Running Man
    const drawPlayer = () => {
      ctx.save();
      ctx.fillStyle = "#8B5CF6"; // Primary Purple
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#8B5CF6";

      // Head
      ctx.fillRect(player.x + 6, player.y, 12, 12);
      // Torso
      ctx.fillRect(player.x + 8, player.y + 12, 8, 14);

      if (isJumping || !gameRunning) {
        // Jumping / Static Pose
        ctx.fillRect(player.x + 2, player.y + 26, 6, 10); // Left leg bent
        ctx.fillRect(player.x + 16, player.y + 26, 6, 14); // Right leg down
        ctx.fillRect(player.x, player.y + 14, 6, 10); // Arm up
        ctx.fillRect(player.x + 18, player.y + 14, 6, 10); // Arm up
      } else {
        // Running Animation (Swaps every 6 frames)
        const runState = Math.floor(frames / 6) % 2;
        if (runState === 0) {
          ctx.fillRect(player.x + 4, player.y + 26, 6, 14); // Left leg down
          ctx.fillRect(player.x + 14, player.y + 26, 6, 8); // Right leg bent up
          ctx.fillRect(player.x + 2, player.y + 14, 6, 10); // Arm forward
          ctx.fillRect(player.x + 16, player.y + 14, 6, 10); // Arm back
        } else {
          ctx.fillRect(player.x + 4, player.y + 26, 6, 8); // Left leg bent up
          ctx.fillRect(player.x + 14, player.y + 26, 6, 14); // Right leg down
          ctx.fillRect(player.x + 16, player.y + 14, 6, 10); // Arm forward
          ctx.fillRect(player.x + 2, player.y + 14, 6, 10); // Arm back
        }
      }
      ctx.restore();
    };

    // Main Game Loop
    const animate = () => {
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Draw Glowing Ground Line
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(logicalWidth, groundY);
      ctx.strokeStyle = "rgba(16, 185, 129, 0.6)"; // Emerald
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#10B981";
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // 1. UPDATE GAME PHYSICS (Only if NOT PAUSED and currently running)
      if (!isPausedRef.current && gameRunning) {
        // Physics (Gravity applied)
        player.dy += GRAVITY;
        player.y += player.dy;

        // Floor collision
        if (player.y + player.h >= groundY) {
          player.y = groundY - player.h;
          player.dy = 0;
          isJumping = false;
        }

        // Obstacles
        for (let i = 0; i < obstacles.length; i++) {
          let obs = obstacles[i];
          obs.x -= gameSpeed;

          // Precise Collision Detection (AABB)
          if (
            player.x + 6 < obs.x + obs.w - 4 &&
            player.x + player.w - 6 > obs.x + 4 &&
            player.y + 4 < obs.y + obs.h &&
            player.y + player.h - 2 > obs.y + 4
          ) {
            gameRunning = false;
            setGameOver(true);
            setHasStarted(false);
            if (currentScore > highScore) {
              setHighScore(currentScore);
              localStorage.setItem("neonRunnerHighScore", currentScore);
            }
          }
        }

        // Remove off-screen obstacles
        obstacles = obstacles.filter((obs) => obs.x + obs.w > 0);

        // Spawn logic
        framesSinceLastSpawn++;
        let minGap = Math.floor(Math.random() * 60 + 90);

        if (framesSinceLastSpawn > minGap) {
          spawnObstacle();
          framesSinceLastSpawn = 0;
        }

        // Speed Scaling
        frames++;
        currentScore++;
        let displayScore = Math.floor(currentScore / 10);

        if (currentScore % 10 === 0) {
          setScore(displayScore);
        }

        if (displayScore >= 150) {
          if (frames % 60 === 0) {
            gameSpeed += 0.03;
          }
        } else {
          if (frames % 500 === 0) {
            gameSpeed += 0.2;
          }
        }
      }

      // 2. ALWAYS DRAW CURRENT STATE (This keeps it visible even when physics are paused)
      drawPlayer();

      for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        ctx.fillStyle = obs.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = obs.color;
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.h);
        ctx.lineTo(obs.x + obs.w / 2, obs.y);
        ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 3. DRAW UI MENUS OVERLAY
      if (!gameRunning) {
        ctx.fillStyle = "#A1A1AA";
        ctx.textAlign = "center";

        if (gameOver) {
          ctx.fillStyle = "#EF4444";
          ctx.shadowBlur = 10;
          ctx.shadowColor = "#EF4444";
          ctx.font = isMobile ? "bold 24px monospace" : "bold 28px monospace";
          ctx.fillText("SYSTEM CRASH", logicalWidth / 2, isMobile ? 80 : 100);
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#A1A1AA";
          ctx.font = isMobile ? "bold 14px monospace" : "bold 18px monospace";
          ctx.fillText(
            "Press Space / Tap to Reboot",
            logicalWidth / 2,
            isMobile ? 120 : 140,
          );
        } else if (!isPausedRef.current) {
          // If paused, don't flash this since the overlay is up
          ctx.font = isMobile ? "bold 14px monospace" : "bold 20px monospace";
          ctx.fillText(
            "Press Space / Tap to Run",
            logicalWidth / 2,
            isMobile ? 100 : 120,
          );
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("touchstart", handleTap);
      container.removeEventListener("mousedown", handleTap);
    };
  }, [hasStarted, gameOver, highScore]); // Ensure isPaused is NOT here to prevent re-rendering restarts

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-[800px] mx-auto select-none cursor-pointer group relative"
    >
      <div className="flex justify-between w-full px-4 mb-3 font-mono text-sm md:text-base text-primary font-bold tracking-widest">
        <span>SCORE: {score}</span>
        <span>HI-SCORE: {highScore}</span>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "auto" }}
        className={`bg-black/40 border rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all touch-none ${
          isPaused
            ? "border-emerald-500/50 opacity-80"
            : "border-borderCol group-hover:border-primary/50"
        }`}
      />
    </div>
  );
};

export default DinoGame;

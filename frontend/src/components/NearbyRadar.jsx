import React, { useEffect, useState } from "react";
import { Loader2, MapPin, AlertCircle, Edit2, Check } from "lucide-react";

const NearbyRadar = ({ socket, onConnect }) => {
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, scanning, found, error
  const [errorMsg, setErrorMsg] = useState("");

  // --- NEW: Name Setup States ---
  const [myName, setMyName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);

  // 1. Load saved name from Local Storage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("fileShareUserName");
    if (savedName) {
      setMyName(savedName);
      setIsNameSet(true);
      // If the socket is ready, tell the server our saved name immediately
      if (socket) socket.emit("set_name", savedName);
    }
  }, [socket]);

  // 2. Listen for nearby devices
  useEffect(() => {
    if (!socket) return;

    socket.on("nearby_devices", (users) => {
      setNearbyDevices(users);
      if (users.length > 0) {
        setStatus("found");
      } else if (status === "found") {
        setStatus("idle");
      }
    });

    return () => socket.off("nearby_devices");
  }, [socket, status]);

  // 3. Save the custom name
  const handleSaveName = (e) => {
    e.preventDefault();
    if (myName.trim()) {
      localStorage.setItem("fileShareUserName", myName.trim());
      socket.emit("set_name", myName.trim());
      setIsNameSet(true);
    }
  };

  // 4. GPS Scanning Logic
  const startScanning = () => {
    setStatus("scanning");
    setErrorMsg("");

    if (window.isSecureContext === false) {
      setStatus("error");
      setErrorMsg(
        "GPS Blocked! You must use a secure HTTPS connection or localhost to use the radar.",
      );
      return;
    }

    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        socket.emit("update_location", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error("GPS Error Details:", error);
        setStatus("error");
        if (error.code === 1)
          setErrorMsg(
            "Permission Denied: Please allow location access in your phone's browser settings.",
          );
        else if (error.code === 2)
          setErrorMsg(
            "Position Unavailable: Make sure your device's GPS/Location service is turned on.",
          );
        else if (error.code === 3)
          setErrorMsg(
            "Timeout: Took too long to find your location. Please try again.",
          );
        else setErrorMsg(error.message || "An unknown GPS error occurred.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className="p-5 bg-surface/60 backdrop-blur-md border border-borderCol rounded-2xl mt-6 mb-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="text-primary" /> GPS Radar
        </h3>

        {/* Name Display / Edit Button (Only shows if name is set) */}
        {isNameSet && (
          <button
            onClick={() => setIsNameSet(false)}
            className="flex items-center gap-2 text-xs text-textMuted hover:text-primary transition-colors bg-black/20 px-3 py-1.5 rounded-full border border-borderCol"
          >
            <span>
              As: <strong className="text-white">{myName}</strong>
            </span>
            <Edit2 size={12} />
          </button>
        )}
      </div>

      {/* STATE 1: User needs to set their name */}
      {!isNameSet ? (
        <form onSubmit={handleSaveName} className="animate-fade-in-up">
          <p className="text-sm text-textMuted mb-3 text-center">
            Set a display name so others can find you on the radar.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="e.g. Name"
              maxLength={20}
              autoFocus
              className="flex-1 bg-black/40 border border-borderCol text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-primary/60"
            />
            <button
              type="submit"
              disabled={!myName.trim()}
              className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
            </button>
          </div>
        </form>
      ) : (
        /* STATE 2: Name is set, show the Radar actions */
        <>
          {status === "idle" && (
            <div className="text-center animate-fade-in-up">
              <p className="text-textMuted text-sm mb-4">
                Find people within 100 meters to share files instantly.
              </p>
              <button
                onClick={startScanning}
                className="w-full bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary/80 transition shadow-[0_0_15px_rgba(139,92,246,0.4)]"
              >
                Scan Area
              </button>
            </div>
          )}

          {status === "scanning" && nearbyDevices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 animate-fade-in-up">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3 drop-shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              <p className="text-center text-white font-medium">
                Broadcasting location...
              </p>
              <p className="text-center text-textMuted text-xs mt-1">
                Waiting for other nearby devices to appear.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-4 text-center animate-fade-in-up">
              <AlertCircle className="w-8 h-8 text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
              <p className="text-red-400 text-sm mb-4 font-medium px-4">
                {errorMsg}
              </p>
              <button
                onClick={startScanning}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {status === "found" && (
            <div className="animate-fade-in-up">
              <p className="text-center text-textMuted text-xs mb-3">
                Devices found within 100 meters:
              </p>
              <ul className="space-y-3">
                {nearbyDevices.map((device) => (
                  <li key={device.socketId}>
                    <button
                      onClick={() => onConnect(device.socketId)}
                      className="w-full bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 p-3 rounded-xl hover:bg-emerald-600/40 hover:-translate-y-1 transition-all font-medium flex justify-between items-center group shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                    >
                      <span className="text-white group-hover:text-emerald-300 transition-colors">
                        {device.deviceName}
                      </span>
                      <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                        Connect
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button
                onClick={startScanning}
                className="w-full mt-5 text-textMuted text-xs hover:text-white transition-colors"
              >
                Refresh Radar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyRadar;

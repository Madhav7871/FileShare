import React, { useEffect, useState } from "react";
import { Loader2, MapPin, AlertCircle } from "lucide-react";

const NearbyRadar = ({ socket, onConnect }) => {
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const [status, setStatus] = useState("idle"); // idle, scanning, found, error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!socket) return;

    // Listen for the server finding someone nearby
    socket.on("nearby_devices", (users) => {
      setNearbyDevices(users);

      // If we found people, update status. If the list is empty, go back to idle.
      if (users.length > 0) {
        setStatus("found");
      } else if (status === "found") {
        setStatus("idle");
      }
    });

    return () => socket.off("nearby_devices");
  }, [socket, status]);

  const startScanning = () => {
    setStatus("scanning");
    setErrorMsg("");

    // 1. Check if the browser is blocking it due to non-HTTPS (Very common on mobile testing!)
    if (window.isSecureContext === false) {
      setStatus("error");
      setErrorMsg(
        "GPS Blocked! You must use a secure HTTPS connection or localhost to use the radar.",
      );
      return;
    }

    // 2. Check if the browser supports GPS at all
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by this browser.");
      return;
    }

    // 3. Ask for coordinates!
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success! Send coordinates to our Node server
        socket.emit("update_location", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        // If no one is found immediately, we can show a scanning state that waits for socket events
        // But for now, we leave it "scanning" until a user is emitted back, or we can revert to idle.
      },
      (error) => {
        // Handle every specific mobile/desktop GPS error
        console.error("GPS Error Details:", error);
        setStatus("error");

        if (error.code === 1) {
          // PERMISSION_DENIED
          setErrorMsg(
            "Permission Denied: Please allow location access in your phone's browser settings.",
          );
        } else if (error.code === 2) {
          // POSITION_UNAVAILABLE
          setErrorMsg(
            "Position Unavailable: Make sure your device's GPS/Location service is turned on.",
          );
        } else if (error.code === 3) {
          // TIMEOUT
          setErrorMsg(
            "Timeout: Took too long to find your location. Please try again.",
          );
        } else {
          setErrorMsg(error.message || "An unknown GPS error occurred.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // Wait up to 10 seconds before throwing a timeout error
        maximumAge: 0, // Force the browser to get the real-time location, not a cached one
      },
    );
  };

  return (
    <div className="p-5 bg-surface/60 backdrop-blur-md border border-borderCol rounded-2xl mt-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-center text-white flex items-center justify-center gap-2">
        <MapPin className="text-primary" /> GPS Radar
      </h3>

      {status === "idle" && (
        <div className="text-center">
          <p className="text-textMuted text-sm mb-4">
            Find people within 100 meters to share files instantly.
          </p>
          <button
            onClick={startScanning}
            className="bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/80 transition shadow-[0_0_15px_rgba(139,92,246,0.4)]"
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
                    Nearby
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <button
            onClick={startScanning}
            className="w-full mt-4 text-textMuted text-xs hover:text-white transition-colors"
          >
            Refresh Radar
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyRadar;

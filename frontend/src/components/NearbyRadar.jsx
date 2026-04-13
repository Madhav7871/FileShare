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
      if (users.length > 0) setStatus("found");
    });

    return () => socket.off("nearby_devices");
  }, [socket]);

  const startScanning = () => {
    setStatus("scanning");
    setErrorMsg("");

    // Check if browser supports GPS
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    // Ask for coordinates!
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success! Send coordinates to our Node server
        socket.emit("update_location", {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        // User clicked "Deny" or GPS failed
        setStatus("error");
        if (error.code === 1)
          setErrorMsg("You must allow location access to find nearby users.");
        else setErrorMsg("Failed to get your location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
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

      {status === "scanning" && (
        <div className="flex flex-col items-center justify-center py-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <p className="text-center text-gray-400 text-sm">
            Broadcasting location... waiting for others.
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
          <button
            onClick={startScanning}
            className="text-primary text-sm hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "found" && (
        <ul className="space-y-3">
          {nearbyDevices.map((device) => (
            <li key={device.socketId}>
              <button
                onClick={() => onConnect(device.socketId)}
                className="w-full bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 p-3 rounded-lg hover:bg-emerald-600/40 transition font-medium flex justify-between items-center"
              >
                <span>{device.deviceName}</span>
                <span className="text-xs bg-emerald-500/20 px-2 py-1 rounded">
                  Nearby
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NearbyRadar;

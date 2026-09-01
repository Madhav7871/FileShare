import React, { useEffect } from "react";

const NativeAd = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pl31126038.profitableratecpmnetwork.com/5c1def5182239cd35baa90e5fca658ca/invoke.js";
    script.async = true;
    script.dataset.cfasync = "false";
    document.body.appendChild(script);
  }, []);

  return (
    <div
      id="container-5c1def5182239cd35baa90e5fca658ca"
      className="flex justify-center my-4"
    ></div>
  );
};

export default NativeAd;

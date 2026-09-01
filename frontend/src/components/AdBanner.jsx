import React, { useEffect, useRef } from "react";

const AdBanner = ({ adKey, width, height }) => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (bannerRef.current && !bannerRef.current.hasChildNodes()) {
      const confScript = document.createElement("script");
      confScript.type = "text/javascript";
      confScript.innerHTML = `
        atOptions = {
          'key' : '${adKey}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      `;
      const invokeScript = document.createElement("script");
      invokeScript.type = "text/javascript";
      invokeScript.src = `//www.highrevenueformat.com/${adKey}/invoke.js`;

      bannerRef.current.appendChild(confScript);
      bannerRef.current.appendChild(invokeScript);
    }
  }, [adKey, width, height]);

  return (
    <div className="flex justify-center my-4 w-full">
      <div ref={bannerRef}></div>
    </div>
  );
};

export default AdBanner;

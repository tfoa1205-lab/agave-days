import { useCallback, useEffect, useRef, useState } from "react";

type DeviceOrientationEventIOS = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useDeviceLevel() {
  const [tilt, setTilt] = useState<number | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const listening = useRef(false);

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.beta === null || e.gamma === null) return;
    setTilt(Math.sqrt(e.beta * e.beta + e.gamma * e.gamma));
  }, []);

  const start = useCallback(() => {
    if (listening.current) return;
    listening.current = true;
    window.addEventListener("deviceorientation", handleOrientation);
  }, [handleOrientation]);

  const requestPermission = useCallback(() => {
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventIOS | undefined;
    if (!DOE) return;
    if (typeof DOE.requestPermission === "function") {
      DOE.requestPermission()
        .then((state) => {
          if (state === "granted") {
            setNeedsPermission(false);
            start();
          }
        })
        .catch(() => {});
    }
  }, [start]);

  useEffect(() => {
    const DOE = window.DeviceOrientationEvent as DeviceOrientationEventIOS | undefined;
    if (!DOE) return;
    if (typeof DOE.requestPermission === "function") {
      setNeedsPermission(true);
      requestPermission();
    } else {
      start();
    }
    return () => {
      listening.current = false;
      window.removeEventListener("deviceorientation", handleOrientation);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { tilt, needsPermission, requestPermission };
}

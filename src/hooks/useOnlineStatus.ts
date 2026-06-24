import { useEffect, useState } from "react";

export function useOnlineStatus() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const check = (label: string) => {
      if (typeof navigator === "undefined") return;
      const current = navigator.onLine;
      // eslint-disable-next-line no-console
      console.log(`[useOnlineStatus:${label}] navigator.onLine =`, current);
      setOnline(current);
      setVerified(true);
    };

    // Re-check on mount
    check("mount");

    // Verify again 1s after load to catch stale initial values
    const timeout = window.setTimeout(() => check("post-load"), 1000);

    const up = () => {
      // eslint-disable-next-line no-console
      console.log("[useOnlineStatus:event] online");
      setOnline(true);
      setVerified(true);
    };
    const down = () => {
      // eslint-disable-next-line no-console
      console.log("[useOnlineStatus:event] offline");
      setOnline(false);
      setVerified(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") check("visibilitychange");
    };

    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { online, verified };
}

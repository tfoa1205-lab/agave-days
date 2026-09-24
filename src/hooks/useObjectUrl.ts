import { useEffect, useState } from "react";

export function useObjectUrl(blob: Blob | undefined | null): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);

    return () => {
      // Don't revoke the outgoing URL immediately: the browser may not have
      // painted the incoming one yet, which shows up as a black flash
      // between photos. Revoke it a couple of frames later instead, once
      // the new image is guaranteed to be on screen.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => URL.revokeObjectURL(objectUrl));
      });
    };
  }, [blob]);

  return url;
}

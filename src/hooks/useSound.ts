"use client";

import { useAppStore } from "@/lib/store";
import { useCallback, useRef, useEffect } from "react";

export function useSound() {
  const playClick = useCallback(() => {
    // Sound disabled by request
  }, []);

  return { playClick };
}

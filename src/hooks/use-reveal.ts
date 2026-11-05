import { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

const MARGIN = 60; // la section doit dépasser un peu dans l'écran

/** Indique quand une section d'un ScrollView arrive à l'écran, pour y lancer une animation une seule fois */
export function useReveal() {
  const [seen, setSeen] = useState<string[]>([]);
  const tops = useRef<Record<string, number>>({});
  const viewport = useRef({ height: 0, offset: 0 });

  const check = () => {
    const { height, offset } = viewport.current;
    if (!height) return;
    const bottom = offset + height - MARGIN;
    setSeen((prev) => {
      const next = Object.keys(tops.current).filter(
        (key) => !prev.includes(key) && tops.current[key] < bottom,
      );
      return next.length ? [...prev, ...next] : prev;
    });
  };

  return {
    revealed: (key: string) => seen.includes(key),
    scrollProps: {
      scrollEventThrottle: 100,
      onLayout: (e: LayoutChangeEvent) => {
        viewport.current.height = e.nativeEvent.layout.height;
        check();
      },
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        viewport.current.offset = e.nativeEvent.contentOffset.y;
        check();
      },
    },
    track: (key: string) => ({
      onLayout: (e: LayoutChangeEvent) => {
        tops.current[key] = e.nativeEvent.layout.y;
        check();
      },
    }),
  };
}

import { useRef, useState } from "react";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";

const PAGE_SIZE = 20;
const END_MARGIN = 300; // la suite arrive un peu avant le bas de la liste

/** Pour une liste déjà en mémoire : en affiche 20, puis 20 de plus en approchant du bas du ScrollView */
export function usePaged<T>(items: T[], resetKey: string) {
  const [count, setCount] = useState(PAGE_SIZE);
  const [lastKey, setLastKey] = useState(resetKey);
  const heights = useRef({ viewport: 0, content: 0 });

  // Nouvelle recherche ou nouveau filtre : on repart des 20 premiers
  if (resetKey !== lastKey) {
    setLastKey(resetKey);
    setCount(PAGE_SIZE);
  }

  const showMore = () => {
    if (count < items.length) setCount(count + PAGE_SIZE);
  };

  // Grand écran : sans défilement possible, il faut continuer jusqu'à remplir la hauteur
  const fillScreen = () => {
    const { viewport, content } = heights.current;
    if (viewport > 0 && content > 0 && content < viewport) showMore();
  };

  return {
    shown: items.slice(0, count),
    scrollProps: {
      scrollEventThrottle: 100,
      onLayout: (e: LayoutChangeEvent) => {
        heights.current.viewport = e.nativeEvent.layout.height;
        fillScreen();
      },
      onContentSizeChange: (_width: number, height: number) => {
        heights.current.content = height;
        fillScreen();
      },
      onScroll: ({ nativeEvent: n }: NativeSyntheticEvent<NativeScrollEvent>) => {
        const bottom = n.layoutMeasurement.height + n.contentOffset.y;
        if (bottom >= n.contentSize.height - END_MARGIN) showMore();
      },
    },
  };
}

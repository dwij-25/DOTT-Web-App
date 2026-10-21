---
name: frontend-animations
description: >-
  Provides advanced context and best practices for creating UI animations using GSAP and Anime.js within the Next.js project. Use this skill when asked to add complex animations, scroll-linked effects, or transition sequences to a component.
---

# Frontend Animation Expert

## Overview
This skill instructs agents on how to safely and performantly implement animations within the DOTT Next.js web application. It enforces a standard methodology using our centralized `animations.ts` utility.

## Centralized Imports
Always import animation libraries from the local utility file rather than `gsap` or `animejs` directly. This ensures that plugins (like `ScrollTrigger`) are registered automatically on the client.

```typescript
// Do this:
import { gsap, useGSAP, anime, ScrollTrigger } from "@/lib/animations";

// Avoid this:
import gsap from "gsap";
```

## Best Practices for GSAP in React
Always use the `@gsap/react` `useGSAP` hook inside React components instead of standard `useEffect`. This handles the strict-mode double-render cleanup automatically, preventing orphaned animations or duplicated ScrollTriggers.

```tsx
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/animations";

export default function MyAnimatedComponent() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // This animation will be automatically cleaned up on unmount!
    gsap.to(".box", { x: 100, rotation: 360, duration: 1 });
  }, { scope: container });

  return (
    <div ref={container}>
      <div className="box">Animate Me</div>
    </div>
  );
}
```

## Best Practices for Anime.js
Use Anime.js for staggering complex SVG paths, UI micro-interactions, or standalone timelines where the weight of GSAP is unnecessary. Just like GSAP, ensure animations are tied to refs and destroyed/paused on component unmount.

```tsx
import { useEffect, useRef } from "react";
import { anime } from "@/lib/animations";

export default function StaggerList() {
  const elementsRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<anime.AnimeInstance | null>(null);

  useEffect(() => {
    if (elementsRef.current) {
      animRef.current = anime({
        targets: elementsRef.current.children,
        translateY: [20, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        easing: 'easeOutQuad'
      });
    }

    return () => {
      // Clean up the anime instance to prevent memory leaks
      if (animRef.current) {
        anime.remove(elementsRef.current?.children);
      }
    }
  }, []);

  return (
    <div ref={elementsRef}>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  );
}
```

## Common Mistakes
1. **Importing GSAP Directly:** If you import GSAP directly from `"gsap"` and try to use `ScrollTrigger` without registering it, the animation will break. Always import from `@/lib/animations`.
2. **Forgetting GSAP Scope:** Not passing a `{ scope: ref }` to `useGSAP()` can cause selectors to globally target unintended elements.
3. **Memory Leaks:** Forgetting to kill Anime.js timelines in a `useEffect` cleanup return function.

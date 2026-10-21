"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/animations";

export default function CustomCursor() {
  const cursorDot = useRef<HTMLDivElement>(null);
  const cursorRing = useRef<HTMLDivElement>(null);
  const particlesContainer = useRef<HTMLDivElement>(null);

  const [hoverProps, setHoverProps] = useState<{width: number, height: number, borderRadius: string} | null>(null);
  const hoverTargetRef = useRef<HTMLElement | null>(null);

  const mouseX = useRef(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const mouseY = useRef(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

  useGSAP(() => {
    // Check if refs exist before creating quicksetters (they will on desktop)
    if (!cursorDot.current || !cursorRing.current) return;

    // Quicksetters for zero-lag performance
    const setDotX = gsap.quickSetter(cursorDot.current, "x", "px");
    const setDotY = gsap.quickSetter(cursorDot.current, "y", "px");
    const setRingX = gsap.quickSetter(cursorRing.current, "x", "px");
    const setRingY = gsap.quickSetter(cursorRing.current, "y", "px");

    let ringObj = { x: mouseX.current, y: mouseY.current };

    // Ticker for smooth ring follow
    gsap.ticker.add(() => {
      let targetX = mouseX.current;
      let targetY = mouseY.current;

      if (hoverTargetRef.current) {
        const rect = hoverTargetRef.current.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }

      // Normal smooth follow (0.25 is the smoothing factor)
      const dt = 1.0 - Math.pow(1.0 - 0.25, gsap.ticker.deltaRatio());
      ringObj.x += (targetX - ringObj.x) * dt;
      ringObj.y += (targetY - ringObj.y) * dt;

      setDotX(mouseX.current);
      setDotY(mouseY.current);
      setRingX(ringObj.x);
      setRingY(ringObj.y);
    });
  }, []);

  const activeParticles = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest("button") || target.closest("a") || target.closest("[data-hoverable='true']") || target.closest("input") || target.closest("textarea") || target.closest("[contenteditable='true']");
      const isHeaderOrFooter = target.closest("header") || target.closest("footer");
      
      if (clickable && isHeaderOrFooter) {
        const el = clickable as HTMLElement;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        
        const br = style.borderRadius;
        
        // If element is suspiciously large (e.g. an overlay link or big block), just do a normal generic hover expansion
        if (rect.width > 400 || rect.height > 200) {
           hoverTargetRef.current = null;
           setHoverProps({
             width: 64,
             height: 64,
             borderRadius: "50%"
           });
        } else {
           hoverTargetRef.current = el;
           setHoverProps({
             width: rect.width + 12,
             height: rect.height + 12,
             borderRadius: br === "0px" ? "8px" : br
           });
        }
      } else {
        hoverTargetRef.current = null;
        setHoverProps(null);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = target.closest("button") || target.closest("a") || target.closest("[data-hoverable='true']") || target.closest("input") || target.closest("textarea") || target.closest("[contenteditable='true']");

      const isTouch = typeof window !== "undefined" && window.matchMedia("(hover: none) and (pointer: coarse)").matches;

      // Only animate the ring click effect if we are on desktop and not magnetically hovered
      if (!isTouch && cursorRing.current && !hoverTargetRef.current) {
        gsap.fromTo(
          cursorRing.current,
          { scale: 0.7 },
          { scale: 1, duration: 0.3, ease: "power2.out" }
        );
      }

      // Do not leave dot on clickable elements
      if (isClickable) return;

      // GSAP dropped dot
      if (particlesContainer.current) {
        const p = document.createElement("div");
        // Black and white glowing particles (square)
        p.className = "absolute w-1 h-1 bg-white shadow-[0_0_10px_rgba(255,255,255,1)] mix-blend-difference";
        p.style.left = `${e.pageX - 2}px`;
        p.style.top = `${e.pageY - 2}px`;
        particlesContainer.current.appendChild(p);

        activeParticles.current.push(p);
        if (activeParticles.current.length > 1) {
          const oldP = activeParticles.current.shift();
          if (oldP && oldP.parentNode) {
            gsap.killTweensOf(oldP);
            oldP.remove();
          }
        }

        gsap.fromTo(p, 
          { opacity: 1, scale: 1 }, 
          { 
            opacity: 0, 
            scale: 0, 
            duration: 1, 
            ease: "sine.out",
            onComplete: () => {
              if (p.parentNode) p.remove();
              const index = activeParticles.current.indexOf(p);
              if (index > -1) {
                activeParticles.current.splice(index, 1);
              }
            }
          }
        );
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    window.addEventListener("mousedown", handleClick, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      window.removeEventListener("mousedown", handleClick);
    };
  }, []);

  return (
    <>
      {/* Particle Container - Must be absolute to scroll with document, renders on all devices */}
      <div ref={particlesContainer} className="absolute top-0 left-0 w-full pointer-events-none z-[100000]" />
      
      {/* Outer Ring - Hidden on mobile via CSS */}
      <div
        ref={cursorRing}
        className="fixed top-0 left-0 pointer-events-none z-[99998] items-center justify-center mix-blend-difference hidden md:flex"
        style={{
          width: hoverProps ? `${hoverProps.width}px` : "32px",
          height: hoverProps ? `${hoverProps.height}px` : "32px",
          marginLeft: hoverProps ? `-${hoverProps.width / 2}px` : "-16px",
          marginTop: hoverProps ? `-${hoverProps.height / 2}px` : "-16px",
          borderRadius: hoverProps ? hoverProps.borderRadius : "50%",
          border: hoverProps ? "1.5px solid rgba(255,255,255,1)" : "1px solid rgba(255,255,255,0.4)",
          backgroundColor: hoverProps ? "rgba(255,255,255,0.05)" : "transparent",
          boxShadow: hoverProps ? "0 0 20px rgba(255,255,255,0.3)" : "0 0 8px rgba(255,255,255,0.3)",
          transition: "width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1), margin 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-radius 0.3s cubic-bezier(0.16, 1, 0.3, 1), border 0.3s, background-color 0.3s, box-shadow 0.3s",
        }}
      />

      {/* Inner Dot - Hidden on mobile via CSS */}
      <div
        ref={cursorDot}
        className="fixed top-0 left-0 w-2 h-2 ml-[-4px] mt-[-4px] bg-white pointer-events-none z-[99999] mix-blend-difference shadow-[0_0_10px_rgba(255,255,255,1)] hidden md:block"
        style={{
          opacity: hoverProps ? 0 : 1,
          transition: "opacity 0.2s"
        }}
      />
    </>
  );
}

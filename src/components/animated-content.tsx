"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { useEffect, useRef } from "react";

type AnimatedContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  distance?: number;
  direction?: "vertical" | "horizontal";
  reverse?: boolean;
  duration?: number;
  initialOpacity?: number;
  scale?: number;
  threshold?: number;
  delay?: number;
};

/**
 * A dependency-light adaptation of React Bits' free AnimatedContent component.
 * It keeps the same entry-motion model while using IntersectionObserver and the
 * Web Animations API so the public site does not need GSAP/ScrollTrigger.
 */
export function AnimatedContent({
  children,
  distance = 22,
  direction = "vertical",
  reverse = false,
  duration = 560,
  initialOpacity = 0,
  scale = 0.985,
  threshold = 0.14,
  delay = 0,
  className = "",
  style,
  ...props
}: AnimatedContentProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const axis = direction === "horizontal" ? "translateX" : "translateY";
    const offset = `${reverse ? -distance : distance}px`;
    const fromTransform = `${axis}(${offset}) scale(${scale})`;
    element.style.opacity = String(initialOpacity);
    element.style.transform = fromTransform;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const animation = element.animate(
          [
            { opacity: initialOpacity, transform: fromTransform },
            { opacity: 1, transform: "translate(0, 0) scale(1)" },
          ],
          { duration, delay, easing: "cubic-bezier(.22, 1, .36, 1)", fill: "forwards" },
        );
        animation.addEventListener("finish", () => {
          element.style.opacity = "1";
          element.style.transform = "none";
        });
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [delay, direction, distance, duration, initialOpacity, reverse, scale, threshold]);

  return (
    <div
      ref={ref}
      className={`animated-content ${className}`.trim()}
      style={style as CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
}

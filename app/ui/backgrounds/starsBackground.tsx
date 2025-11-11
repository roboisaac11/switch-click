"use client";

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from "react";
import styles from "./starsBackground.module.css";

const NUM_STARS = 200;

type Star = {
  id: string;
  size: number;
  top: number;
  left: number;
  animationDelay: number;
  velocityX: number;
  velocityY: number;
  driftX: number;
  driftY: number;
  translateX?: number;
  translateY?: number;
};

// Mouse movement handler
interface MousePosition {
  x: number;
  y: number;
}

export default function StarsBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const mousePos = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);

  // Initialize stars once on client
  useLayoutEffect(() => {
    const initialStars = Array.from({ length: NUM_STARS }, () => ({
      id: crypto.randomUUID(),
      size: Math.random() * 3 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      animationDelay: Math.random() * 2,
      velocityX: 0,
      velocityY: 0,
      driftX: (Math.random() - 0.5) * 0.05,
      driftY: (Math.random() - 0.5) * 0.05,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStars(initialStars);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    mousePos.current = { x: e.clientX, y: e.clientY } as MousePosition;
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Animation loop
  useEffect(() => {
    function animate() {
      setStars((prevStars) =>
        prevStars.map((star) => {
          // Calculate distance to mouse
          const deltaX = mousePos.current.x - (star.left / 100) * window.innerWidth;
          const deltaY = mousePos.current.y - (star.top / 100) * window.innerHeight;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) || 1;

          // Force towards cursor
          const moveFactor = 0.1;
          const moveX = (deltaX * moveFactor) / distance;
          const moveY = (deltaY * moveFactor) / distance;

          let newVelocityX = star.velocityX + moveX;
          let newVelocityY = star.velocityY + moveY;

          // Apply momentum
          newVelocityX *= 0.98;
          newVelocityY *= 0.98;

          // Apply drift
          newVelocityX = newVelocityX * 0.795 + star.driftX;
          newVelocityY = newVelocityY * 0.795 + star.driftY;

          return {
            ...star,
            velocityX: newVelocityX,
            velocityY: newVelocityY,
            translateX: (newVelocityX * 10) || 0,
            translateY: (newVelocityY * 10) || 0,
          };
        })
      );

      animationRef.current = requestAnimationFrame(animate);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.sky}>
      {stars.map((star) => (
        <div
          key={star.id}
          className={styles.star}
          style={{
            width: `${star.size}px`,
            height: `${star.size}px`,
            top: `${star.top}vh`,
            left: `${star.left}vw`,
            animationDelay: `${star.animationDelay}s`,
            transform: `translate(${star.translateX || 0}px, ${star.translateY || 0}px)`,
          }}
        />
      ))}
    </div>
  );
}

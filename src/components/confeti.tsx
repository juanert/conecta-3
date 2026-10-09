"use client";

import { useEffect, useRef } from "react";

const COLORES = ["#ef4444", "#f59e0b", "#10b981", "#38bdf8", "#8b5cf6", "#ec4899"];

type Particula = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
};

/** Lanza confeti cada vez que cambia `disparo` (si es mayor que 0) */
export function Confeti({ disparo }: { disparo: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ajustar = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || disparo === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const particulas: Particula[] = Array.from({ length: 90 }, () => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      opacity: 1,
    }));

    let animacion = 0;
    const animar = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let vivas = false;
      for (const p of particulas) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravedad
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.012;
        if (p.opacity <= 0) continue;
        vivas = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
      if (vivas) animacion = requestAnimationFrame(animar);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    animar();

    return () => {
      cancelAnimationFrame(animacion);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [disparo]);

  return <canvas ref={canvasRef} className="confetti-canvas" aria-hidden />;
}

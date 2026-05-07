import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { ReactionBurstPayload } from "@defense/shared";

export interface ReactionParticlesHandle {
  spawn(burst: ReactionBurstPayload): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  emoji: string;
  size: number;
  rot: number;
  vrot: number;
}

const PARTICLES_PER_BURST = 6;

const ReactionParticles = forwardRef<ReactionParticlesHandle, object>(
  function ReactionParticles(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number | null>(null);

    useImperativeHandle(ref, () => ({
      spawn(burst: ReactionBurstPayload) {
        const emoji = burst.reaction === "LAUGH" ? "😂" : "🔥";
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ax = w * (0.15 + Math.random() * 0.7);
        const ay = h * (0.7 + Math.random() * 0.2);
        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
          const angle =
            -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2.5);
          const speed = 220 + Math.random() * 240;
          particlesRef.current.push({
            x: ax + (Math.random() - 0.5) * 30,
            y: ay,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0,
            ttl: 1.6 + Math.random() * 0.5,
            emoji,
            size: 32 + Math.random() * 18,
            rot: (Math.random() - 0.5) * 0.6,
            vrot: (Math.random() - 0.5) * 2,
          });
        }
      },
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let last = performance.now();

      const resize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const remaining: Particle[] = [];
        for (const p of particlesRef.current) {
          p.life += dt;
          if (p.life >= p.ttl) continue;
          p.vy += 90 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vrot * dt;
          const k = Math.max(0, 1 - p.life / p.ttl);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = k;
          ctx.font = `${p.size}px system-ui, "Apple Color Emoji", "Segoe UI Emoji"`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.emoji, 0, 0);
          ctx.restore();
          remaining.push(p);
        }
        particlesRef.current = remaining;
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      return () => {
        window.removeEventListener("resize", resize);
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-50"
      />
    );
  },
);

export default ReactionParticles;

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const FLIGHT_DURATION_MS = 700;
// Final on-screen size of the thumb in the saved panel (matches THUMB_SIZE in
// BoardSavedPanel). Used to compute the scale ratio.
const THUMB_SIZE_PX = 132;

interface Flight {
  id: string;
  imageUrl: string;
  /** Initial position (where the source image sits). */
  startX: number;
  startY: number;
  /** Initial rendered size (the source image's box). */
  width: number;
  height: number;
  /** Translation in pixels to apply at the end of the flight. */
  dx: number;
  dy: number;
  /** Scale factor at the end (THUMB / max(width, height)). */
  scale: number;
  /** Set true on next frame so the transition fires from start → end. */
  arrived: boolean;
}

const Clone = styled.div`
  position: fixed;
  border-radius: 12px;
  overflow: hidden;
  pointer-events: none;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  transform-origin: top left;
  /* Animate transform + opacity ONLY — both are GPU-accelerated and don't
     trigger layout. cubic-bezier(0.22, 1, 0.36, 1) ≈ ease-out-expo: fast off
     the source, smooth landing. */
  transition:
    transform ${FLIGHT_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity ${FLIGHT_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform, opacity;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface TriggerArgs {
  imageUrl: string;
  sourceRect: DOMRect | null;
  destRect: DOMRect | null;
}

export function useFlightAnimation(): {
  trigger: (args: TriggerArgs) => void;
  portal: React.ReactPortal | null;
} {
  const [flights, setFlights] = useState<Flight[]>([]);
  const portalTargetRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    portalTargetRef.current = document.body;
  }, []);

  const trigger = useCallback((args: TriggerArgs) => {
    if (prefersReducedMotion()) return;
    if (!args.sourceRect || !args.destRect) return;

    const { sourceRect, destRect } = args;

    // Aim at the leading edge of the saved panel's thumb row (a touch in
    // from its left padding). Centering on the panel midpoint over-shoots
    // the row visually since the row is left-aligned.
    const targetX = destRect.left + 12;
    const targetY = destRect.top + destRect.height - THUMB_SIZE_PX - 12;

    const longerSide = Math.max(sourceRect.width, sourceRect.height, 1);
    const scale = THUMB_SIZE_PX / longerSide;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const flight: Flight = {
      id,
      imageUrl: args.imageUrl,
      startX: sourceRect.left,
      startY: sourceRect.top,
      width: sourceRect.width,
      height: sourceRect.height,
      dx: targetX - sourceRect.left,
      dy: targetY - sourceRect.top,
      scale,
      arrived: false,
    };

    setFlights((prev) => [...prev, flight]);

    // Two RAFs: first lets the browser commit the initial-state styles,
    // second flips `arrived` so the transition runs from start → end.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlights((prev) =>
          prev.map((f) => (f.id === id ? { ...f, arrived: true } : f)),
        );
      });
    });

    window.setTimeout(() => {
      setFlights((prev) => prev.filter((f) => f.id !== id));
    }, FLIGHT_DURATION_MS + 80);
  }, []);

  const portal = portalTargetRef.current
    ? createPortal(
        <>
          {flights.map((f) => (
            <Clone
              key={f.id}
              style={{
                left: f.startX,
                top: f.startY,
                width: f.width,
                height: f.height,
                transform: f.arrived
                  ? `translate(${f.dx}px, ${f.dy}px) scale(${f.scale})`
                  : 'translate(0, 0) scale(1)',
                // Stay opaque most of the flight; fade only at the very end.
                opacity: f.arrived ? 0 : 1,
              }}
            >
              <img src={f.imageUrl} alt="" />
            </Clone>
          ))}
        </>,
        portalTargetRef.current,
      )
    : null;

  return { trigger, portal };
}

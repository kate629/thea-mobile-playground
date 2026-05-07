import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const FLIGHT_DURATION_MS = 500;

interface Flight {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  endX: number;
  endY: number;
  endW: number;
  endH: number;
  /** Set true on next frame so the transition fires from start → end. */
  arrived: boolean;
}

const Clone = styled.div`
  position: fixed;
  z-index: 50;
  border-radius: 10px;
  overflow: hidden;
  pointer-events: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  transition:
    transform ${FLIGHT_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1),
    opacity ${FLIGHT_DURATION_MS}ms ease-out;
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
  // Stable portal target — body is fine for fixed positioning.
  const portalTargetRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    portalTargetRef.current = document.body;
  }, []);

  const trigger = useCallback((args: TriggerArgs) => {
    if (prefersReducedMotion()) return;
    if (!args.sourceRect || !args.destRect) return;

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const flight: Flight = {
      id,
      imageUrl: args.imageUrl,
      startX: args.sourceRect.left,
      startY: args.sourceRect.top,
      startW: args.sourceRect.width,
      startH: args.sourceRect.height,
      endX: args.destRect.left + args.destRect.width / 2 - 32,
      endY: args.destRect.top + args.destRect.height / 2 - 32,
      endW: 64,
      endH: 64,
      arrived: false,
    };

    setFlights((prev) => [...prev, flight]);

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
                left: f.arrived ? f.endX : f.startX,
                top: f.arrived ? f.endY : f.startY,
                width: f.arrived ? f.endW : f.startW,
                height: f.arrived ? f.endH : f.startH,
                opacity: f.arrived ? 0.4 : 1,
                transform: f.arrived ? 'scale(0.9)' : 'scale(1)',
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

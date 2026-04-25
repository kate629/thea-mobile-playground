import { useEffect, useState } from 'react';

const TYPE_SPEED_MS = 35;
const HOLD_AFTER_DONE_MS = 5000;

export interface QuizLoadingTypewriterSlice {
  text: string;
  showCursor: boolean;
}

/**
 * Drives the rotating typewriter copy on the quiz loading screen. Cycles
 * through the provided messages — types each at TYPE_SPEED_MS per character,
 * holds HOLD_AFTER_DONE_MS once typed, then advances. Loops back to the start
 * when it reaches the end so the page never goes blank during a long wait.
 */
export function useQuizLoadingTypewriter(messages: string[]): QuizLoadingTypewriterSlice {
  const safeMessages = messages.length > 0 ? messages : [''];
  const [messageIndex, setMessageIndex] = useState(0);
  const [typedCount, setTypedCount] = useState(0);

  // If the messages list shrinks under us, snap back into range.
  useEffect(() => {
    if (messageIndex >= safeMessages.length) {
      setMessageIndex(0);
      setTypedCount(0);
    }
  }, [safeMessages.length, messageIndex]);

  const current = safeMessages[messageIndex] ?? '';
  const isDone = typedCount >= current.length;

  useEffect(() => {
    if (isDone) return;
    const t = setTimeout(() => setTypedCount((c) => c + 1), TYPE_SPEED_MS);
    return () => clearTimeout(t);
  }, [typedCount, isDone, current]);

  useEffect(() => {
    if (!isDone) return;
    if (safeMessages.length <= 1) return;
    const t = setTimeout(() => {
      setMessageIndex((prev) => (prev + 1) % safeMessages.length);
      setTypedCount(0);
    }, HOLD_AFTER_DONE_MS);
    return () => clearTimeout(t);
  }, [isDone, safeMessages.length]);

  return {
    text: current.slice(0, typedCount),
    showCursor: !isDone,
  };
}

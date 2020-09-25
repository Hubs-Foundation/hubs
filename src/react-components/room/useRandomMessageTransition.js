import { useEffect, useState, useRef, useCallback } from "react";

export function useRandomMessageTransition(messages, transitionDelay = 5000) {
  const messageTimeoutRef = useRef();
  const [index, setIndex] = useState(Math.round(Math.random() * (messages.length - 1)));

  const queueNextMessage = useCallback(
    () => {
      messageTimeoutRef.current = setTimeout(() => {
        setIndex(currentIndex => (currentIndex + 1) % messages.length);
        queueNextMessage();
      }, transitionDelay);
    },
    [setIndex, messages, transitionDelay]
  );

  useEffect(
    () => {
      queueNextMessage();

      return () => {
        clearTimeout(messageTimeoutRef.current);
      };
    },
    [queueNextMessage]
  );

  return messages[index];
}

import { useRef, useEffect, useCallback, useState } from "react";

export function useMaintainScrollPosition(items) {
  const listRef = useRef();
  const [scrolledToBottom, setScrolledToBottom] = useState(true);

  const onScrollList = useCallback(
    e => {
      const el = e.target;
      setScrolledToBottom(el.scrollHeight - el.scrollTop === el.clientHeight);
    },
    [setScrolledToBottom]
  );

  useEffect(
    () => {
      if (scrolledToBottom) {
        const el = listRef.current;

        if (el.scrollTop !== el.scrollHeight) {
          el.scrollTop = el.scrollHeight;
        }
      }
    },
    [items, scrolledToBottom]
  );

  return [onScrollList, listRef, scrolledToBottom];
}

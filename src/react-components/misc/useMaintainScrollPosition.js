import { useRef, useEffect, useCallback } from "react";

export function useMaintainScrollPosition(items) {
  const listRef = useRef();
  const scrolledToBottomRef = useRef(true);

  const onScrollList = useCallback(e => {
    const el = e.target;
    scrolledToBottomRef.current = el.scrollHeight - el.scrollTop === el.clientHeight;
  }, []);

  useEffect(
    () => {
      if (scrolledToBottomRef.current) {
        const el = listRef.current;
        el.scrollTop = el.scrollHeight;
      }
    },
    [items]
  );

  return [onScrollList, listRef];
}

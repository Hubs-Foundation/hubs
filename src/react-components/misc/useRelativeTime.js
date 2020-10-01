import { useEffect, useState } from "react";
import dayjs from "dayjs-ext";
import relativeTime from "dayjs-ext/plugin/relativeTime";

dayjs.extend(relativeTime);

export function useRelativeTime(timestamp, updateInterval = 1000) {
  const [relativeTime, setRelativeTime] = useState(() => dayjs(timestamp).fromNow());

  useEffect(
    () => {
      let timeout;

      function updateRelativeTime() {
        setRelativeTime(dayjs(timestamp).fromNow());
        timeout = setTimeout(updateRelativeTime, updateInterval);
      }

      timeout = setTimeout(updateRelativeTime, updateInterval);

      return () => {
        clearTimeout(timeout);
      };
    },
    [setRelativeTime, timestamp, updateInterval]
  );

  return relativeTime;
}

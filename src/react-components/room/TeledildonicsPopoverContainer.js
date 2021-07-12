import React, { useEffect, useState } from "react";
import { TeledildonicsPopoverButton } from "./TeledildonicsPopover";
import { getMicrophonePresences } from "../../utils/microphone-presence";

export function userFromPresence(sessionId, presence, micPresences, mySessionId) {
  const meta = presence.metas[presence.metas.length - 1];
  const micPresence = micPresences.get(sessionId);
  return { id: sessionId, isMe: mySessionId === sessionId, micPresence, ...meta };
}

function usePeopleList(presences, mySessionId, micUpdateFrequency = 500) {
  const [people, setPeople] = useState([]);

  useEffect(
    () => {
      let timeout;

      function updateMicrophoneState() {
        const micPresences = getMicrophonePresences();

        setPeople(
          Object.entries(presences).map(([id, presence]) => {
            return userFromPresence(id, presence, micPresences, mySessionId);
          })
        );

        timeout = setTimeout(updateMicrophoneState, micUpdateFrequency);
      }

      updateMicrophoneState();

      return () => {
        clearTimeout(timeout);
      };
    },
    [presences, micUpdateFrequency, setPeople, mySessionId]
  );

  return people;
}

export function TeledildonicsPopoverContainer({ presences, mySessionId }) {
  const people = usePeopleList(presences, mySessionId);
  return <TeledildonicsPopoverButton items={people} />;
}

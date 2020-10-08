import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { PeopleSidebar } from "./PeopleSidebar";
import { getMicrophonePresences } from "../../utils/microphone-presence";
import ProfileEntryPanel from "../profile-entry-panel";
import { UserProfileSidebarContainer } from "./UserProfileSidebarContainer";

function usePeopleList(presences, mySessionId, micUpdateFrequency = 500) {
  const [people, setPeople] = useState([]);

  useEffect(
    () => {
      let timeout;

      function updateMicrophoneState() {
        const micPresences = getMicrophonePresences();

        setPeople(
          Object.entries(presences).map(([id, presence]) => {
            const meta = presence.metas[presence.metas.length - 1];
            const micPresence = micPresences.get(id);
            return { id, isMe: mySessionId === id, micPresence, ...meta };
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

function PeopleListContainer({ hubChannel, presences, mySessionId, onSelectPerson, onClose }) {
  const people = usePeopleList(presences, mySessionId);

  const onMuteAll = useCallback(
    () => {
      for (const person of people) {
        if (person.presence === "room" && person.permissions && !person.permissions.mute_users) {
          hubChannel.mute(person.id);
        }
      }
    },
    [people, hubChannel]
  );

  return (
    <PeopleSidebar
      people={people}
      onSelectPerson={onSelectPerson}
      onClose={onClose}
      onMuteAll={onMuteAll}
      showMuteAll={hubChannel.can("mute_users")}
    />
  );
}

PeopleListContainer.propTypes = {
  onSelectPerson: PropTypes.func.isRequired,
  hubChannel: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  mySessionId: PropTypes.string.isRequired,
  presences: PropTypes.object.isRequired
};

export function PeopleSidebarContainer({
  hubChannel,
  presences,
  mySessionId,
  displayNameOverride,
  store,
  mediaSearchStore,
  onClose
}) {
  const [selectedPerson, setSelectedPerson] = useState(null);

  if (selectedPerson) {
    if (selectedPerson.id === mySessionId) {
      return (
        <ProfileEntryPanel
          containerType="sidebar"
          displayNameOverride={displayNameOverride}
          store={store}
          mediaSearchStore={mediaSearchStore}
          finished={() => setSelectedPerson(null)}
          history={history}
          showBackButton
          onBack={() => setSelectedPerson(null)}
        />
      );
    } else {
      return <UserProfileSidebarContainer user={selectedPerson} onBack={() => setSelectedPerson(null)} />;
    }
  }

  return (
    <PeopleListContainer
      onSelectPerson={setSelectedPerson}
      onClose={onClose}
      hubChannel={hubChannel}
      presences={presences}
      mySessionId={mySessionId}
    />
  );
}

PeopleSidebarContainer.propTypes = {
  displayNameOverride: PropTypes.string,
  store: PropTypes.object.isRequired,
  mediaSearchStore: PropTypes.object.isRequired,
  hubChannel: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  onOpenAvatarSettings: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  mySessionId: PropTypes.string.isRequired,
  presences: PropTypes.object.isRequired
};

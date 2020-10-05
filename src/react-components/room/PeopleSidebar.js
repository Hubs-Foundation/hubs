import React from "react";
import PropTypes from "prop-types";
import styles from "./PeopleSidebar.scss";
import { Sidebar } from "../sidebar/Sidebar";
import { IconButton } from "../input/IconButton";
import { ReactComponent as CloseIcon } from "../icons/Close.svg";
import { ReactComponent as StarIcon } from "../icons/Star.svg";
import { ReactComponent as DesktopIcon } from "../icons/Desktop.svg";
import { ReactComponent as DiscordIcon } from "../icons/Discord.svg";
import { ReactComponent as PhoneIcon } from "../icons/Phone.svg";
import { ReactComponent as VRIcon } from "../icons/VR.svg";
import { ReactComponent as VolumeOffIcon } from "../icons/VolumeOff.svg";
import { ReactComponent as VolumeHighIcon } from "../icons/VolumeHigh.svg";
import { ReactComponent as VolumeMutedIcon } from "../icons/VolumeMuted.svg";
import { List, ButtonListItem } from "../layout/List";

function getDeviceLabel(device) {
  switch (device) {
    case "discord-bot":
      return "Discord Bot";
    case "phone":
      return "On Mobile";
    case "VR":
      return "In VR";
    case "desktop":
    default:
      return "On Desktop";
  }
}

function getDeviceIconComponent(device) {
  switch (device) {
    case "discord-bot":
      return DiscordIcon;
    case "phone":
      return PhoneIcon;
    case "VR":
      return VRIcon;
    case "desktop":
    default:
      return DesktopIcon;
  }
}

function getVoiceLabel(micStatus) {
  switch (micStatus) {
    case "talking":
      return "Talking";
    case "muted":
      return "Muted";
    case "unmuted":
    default:
      return "Not Talking";
  }
}

function getVoiceIconComponent(micStatus) {
  switch (micStatus) {
    case "talking":
      return VolumeHighIcon;
    case "muted":
      return VolumeMutedIcon;
    case "unmuted":
      return VolumeOffIcon;
    default:
      return undefined;
  }
}

// TODO: i18n
function getPresenceMessage(presence) {
  switch (presence) {
    case "lobby":
      return "In Lobby";
    case "room":
      return "In Room";
    case "entering":
      return "Entering Room";
    default:
      return undefined;
  }
}

function getPersonName(person) {
  return person.name + (person.isMe ? " (You)" : "");
}

function getLabel(person) {
  if (person.device === "discord-bot") {
    return `${getDeviceLabel(person.device)}, ${getPersonName(person)} is ${getPresenceMessage(person.presence)}.`;
  }

  return `${person.isModerator ? "Moderator " : ""}${getPersonName(person)}, is ${getPresenceMessage(
    person.presence
  )} and ${getVoiceLabel(person.prs)} ${getDeviceLabel(person.device)}.`;
}

export function PeopleSidebar({ people, onSelectPerson, onClose }) {
  return (
    <Sidebar
      title={`People (${people.length})`}
      beforeTitle={
        <IconButton className={styles.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} />
        </IconButton>
      }
      afterTitle={
        <IconButton className={styles.muteAllButton} onClick={onClose}>
          Mute All
        </IconButton>
      }
    >
      <List>
        {people.map(person => {
          const DeviceIcon = getDeviceIconComponent(person.device);
          const VoiceIcon = getVoiceIconComponent(person.micStatus);

          return (
            <ButtonListItem
              className={styles.person}
              key={person.id}
              type="button"
              aria-label={getLabel(person)}
              onClick={e => onSelectPerson(person, e)}
            >
              {<DeviceIcon title={getDeviceLabel(person.device)} />}
              {VoiceIcon && <VoiceIcon title={getVoiceLabel(person.micStatus)} />}
              <p>{getPersonName(person)}</p>
              {person.isModerator && (
                <StarIcon title="Moderator" className={styles.moderatorIcon} width={12} height={12} />
              )}
              <p className={styles.presence}>{getPresenceMessage(person.presence)}</p>
            </ButtonListItem>
          );
        })}
      </List>
    </Sidebar>
  );
}

PeopleSidebar.propTypes = {
  people: PropTypes.array,
  onSelectPerson: PropTypes.func,
  onClose: PropTypes.func
};

PeopleSidebar.defaultProps = {
  onSelectPerson: () => {}
};

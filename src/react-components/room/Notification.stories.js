import classNames from "classnames";
import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import styles from "../../assets/stylesheets/presence-log.scss";
import PermissionMessage from "../permission-message";
import { NotificationsContainer } from "./NotificationsContainer";

export default {
  title: "Room/Notifications",
  parameters: {
    layout: "fullscreen"
  }
};

const entryClasses = {
  [styles.presenceLogEntry]: true
};

const entries = [
  {
    key: 1665998426640,
    permission: "voice_chat",
    body: {
      permission: "voice_chat",
      status: true
    }
  },
  {
    key: 1665998426641,
    permission: "text_chat",
    body: {
      permission: "text_chat",
      status: false
    }
  },
  {
    key: 1665998426642,
    permission: "text_chat",
    body: {
      permission: "text_chat",
      status: true
    }
  },
  {
    key: 1665998426643,
    permission: "voice_chat",
    body: {
      permission: "voice_chat",
      status: false
    }
  }
];

export const Base = () => (
  <RoomLayout
    viewport={
      <NotificationsContainer>
        <div
          style={{ alignItems: "center" }}
          className={classNames(styles.presenceLog, styles["presenceLogPermission"])}
        >
          {entries.map(entry => {
            return (
              <PermissionMessage
                key={entry.key}
                permission={entry.permission}
                className={classNames(entryClasses, styles.permission)}
                body={entry.body}
                isMod={false}
              />
            );
          })}
        </div>
      </NotificationsContainer>
    }
  />
);

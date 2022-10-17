import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import styles from "../assets/stylesheets/presence-log.scss";
import classNames from "classnames";
import { formatSystemMessage } from "./room/ChatSidebar";

import ChatMessage from "./chat-message";
import PhotoMessage from "./photo-message";
import VideoMessage from "./video-message";
import ImageMessage from "./image-message";
import { getPresenceContextForSession } from "../utils/phoenix-utils";
import { useIntl } from "react-intl";
import PermissionMessage from "./permission-message";
import { useCan } from "./room/useCan";

export const presets = [
  "InRoom",
  "Notifications"
];

export function PresenceLog({ entries, preset, hubId, history, presences, onViewProfile, include, exclude, ...rest }) {
  const intl = useIntl();
  const isMod = useCan("kick_users");
  const [logEntries, setLogEntries] = useState(null);

  const domForEntry = useCallback(e => {
    if (include && !include.includes(e.type)) return;
    if (exclude && exclude.includes(e.type)) return;

    const entryClasses = {
      [styles.presenceLogEntry]: true,
      [styles.presenceLogEntryWithButton]: (e.type === "chat" || e.type === "image") && e.maySpawn,
      [styles.presenceLogChat]: e.type === "chat",
      [styles.expired]: !!e.expired
    };

    const presenceContext = e.sessionId ? getPresenceContextForSession(presences, e.sessionId) : {};
    const isBot = !!presenceContext.discord;

    switch (e.type) {
      case "chat":
        return (
          <ChatMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses)}
            body={e.body}
            maySpawn={e.maySpawn}
            sessionId={e.sessionId}
            includeFromLink={preset === "inRoom" && !isBot}
            history={history}
            onViewProfile={onViewProfile}
          />
        );
      case "image":
        return (
          <ImageMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses, styles.media)}
            body={e.body}
            maySpawn={e.maySpawn}
          />
        );
      case "photo":
        return (
          <PhotoMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses, styles.media)}
            body={e.body}
            maySpawn={e.maySpawn}
            hubId={hubId}
          />
        );
      case "video":
        return (
          <VideoMessage
            key={e.key}
            name={e.name}
            className={classNames(entryClasses, styles.media)}
            body={e.body}
            maySpawn={e.maySpawn}
            hubId={hubId}
          />
        );
      case "permission":
        return !isMod && (
          <PermissionMessage
            key={e.key}
            permission={e.body.permission}
            className={classNames(entryClasses, styles.permission)}
            body={e.body}
            isMod={isMod}
          />
        );
      default: {
        const systemMessage = formatSystemMessage(e, intl);

        return (
          systemMessage && (
            <div key={e.key} className={classNames(entryClasses)}>
              <div>{systemMessage}</div>
            </div>
          )
        );
      }
    }
  }, [history, hubId, preset, intl, onViewProfile, presences, include, exclude, isMod]);

  useEffect(() => {
    setLogEntries(entries.map(domForEntry));
  }, [domForEntry, entries, setLogEntries]);
  
  return (<div className={classNames( 
      styles.presenceLog,
      styles["presenceLog" + preset]
    )} {...rest}>{logEntries}</div>);
}

PresenceLog.propTypes = {
  entries: PropTypes.array,
  preset: PropTypes.oneOf(presets),
  hubId: PropTypes.string,
  history: PropTypes.object,
  presences: PropTypes.object,
  onViewProfile: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
  include: PropTypes.array,
  exclude: PropTypes.array
};
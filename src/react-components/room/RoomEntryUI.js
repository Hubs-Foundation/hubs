import React, { useState, useReducer } from "react";
import PropTypes from "prop-types";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as MoreIcon } from "../icons/More.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import styleUtils from "../styles/style-utils.scss";
import configs from "../../utils/configs";
import { RoomEntryModal } from "./RoomEntryModal";
import { MicPermissionsModal } from "./MicPermissionsModal";
import { EnterOnDeviceUI } from "./EnterOnDeviceUI";
import { InvitePopoverButton } from "./InvitePopover";

function reducer(state, action) {
  switch (action.type) {
    case "join-room":
      return { activeModalId: "mic-permissions", entryMode: "screen" };
    case "enter-on-device":
      return { activeModalId: "enter-on-device" };
    case "enter-on-device-back":
      return { activeModalId: "room-entry" };
    case "mic-permissions-back":
      if (state.entryMode === "2d") {
        return { activeModalId: "room-entry" };
      } else {
        return { activeModalId: "enter-on-device" };
      }
    case "connected-on-device":
      return { activeModalId: "room-entry" };
    case "enter-on-connected-headset":
      return { activeModalId: "mic-permissions", entryMode: "headset" };
  }
}

export function RoomEntryUI({ hub, linkChannel, onEnter }) {
  const [{ activeModalId }, dispatch] = useReducer(reducer, {
    activeModalId: "room-entry"
  });

  // TODO: Move to Hub class
  const shortLink = `https://${configs.SHORTLINK_DOMAIN}/${hub.hub_id}`;
  const embedUrl = `${location.protocol}//${location.host}${location.pathname}?embed_token=${hub.embed_token}`;
  const embedText = `<iframe src="${embedUrl}" style="width: 1024px; height: 768px;" allow="microphone; camera; vr; speaker;"></iframe>`;

  let activeModal;

  if (activeModalId === "room-entry") {
    // TODO: Add appName to RoomEntryModal.
    activeModal = (
      <RoomEntryModal
        logoSrc={configs.image("logo")}
        roomName={hub.name}
        onJoinRoom={() => dispatch({ type: "join-room" })}
        onEnterOnDevice={() => dispatch({ type: "enter-on-device" })}
      />
    );
  } else if (activeModalId === "mic-permissions") {
    activeModal = <MicPermissionsModal onBack={() => dispatch({ type: "mic-permissions-back" })} />;
  } else if (activeModalId === "enter-on-device") {
    activeModal = (
      <EnterOnDeviceUI
        linkChannel={linkChannel}
        onBack={() => dispatch({ type: "enter-on-device-back" })}
        onConnectedOnDevice={() => dispatch({ type: "connected-on-device" })}
        onEnterOnConnectedHeadset={() => dispatch({ type: "enter-on-connected-headset" })}
      />
    );
  }

  return (
    <RoomLayout
      modal={activeModal}
      toolbarLeft={<InvitePopoverButton url={shortLink} code={hub.entry_code} embed={embedText} />}
      toolbarCenter={
        <>
          <InvitePopoverButton className={styleUtils.hideMd} url={shortLink} code={hub.entry_code} embed={embedText} />
          <ToolbarButton icon={<ChatIcon />} label="Chat" preset="blue" />
        </>
      }
      toolbarRight={<ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />}
    />
  );
}

RoomEntryUI.propTypes = {
  hub: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  linkChannel: PropTypes.object.isRequired,
  onEnter: PropTypes.func
};

import React, { useReducer } from "react";
import PropTypes from "prop-types";
import { RoomLayout } from "../layout/RoomLayout";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as MoreIcon } from "../icons/More.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import styleUtils from "../styles/style-utils.scss";
import configs from "../../utils/configs";
import { RoomEntryModal } from "./RoomEntryModal";
import { MicPermissionsModalContainer } from "./MicPermissionsModalContainer";
import { EnterOnDeviceModalContainer } from "./EnterOnDeviceModalContainer";
import { InvitePopoverContainer } from "./InvitePopoverContainer";

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

export function RoomEntryModalContainer({ hub, linkChannel, onEnter }) {
  const [{ activeModalId }, dispatch] = useReducer(reducer, {
    activeModalId: "room-entry"
  });

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
    activeModal = <MicPermissionsModalContainer onBack={() => dispatch({ type: "mic-permissions-back" })} />;
  } else if (activeModalId === "enter-on-device") {
    activeModal = (
      <EnterOnDeviceModalContainer
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
      toolbarLeft={<InvitePopoverContainer hub={hub} />}
      toolbarCenter={
        <>
          <InvitePopoverContainer className={styleUtils.hideMd} hub={hub} />
          <ToolbarButton icon={<ChatIcon />} label="Chat" preset="blue" />
        </>
      }
      toolbarRight={<ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />}
    />
  );
}

RoomEntryModalContainer.propTypes = {
  hub: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  linkChannel: PropTypes.object.isRequired,
  onEnter: PropTypes.func
};

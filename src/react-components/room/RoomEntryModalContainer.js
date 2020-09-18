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
import { MicSetupModal } from "./MicSetupModal";

function reducer(state, action) {
  switch (action.type) {
    case "join-room":
      return { ...state, activeModalId: "mic-permissions", entryMode: "screen" };
    case "enter-on-device":
      return { ...state, activeModalId: "enter-on-device" };
    case "enter-on-device-back":
      return { ...state, activeModalId: "room-entry" };
    case "connected-on-device":
      return { ...state, activeModalId: "room-entry" };
    case "enter-on-connected-headset":
      return { ...state, activeModalId: "mic-permissions", entryMode: "headset" };
    case "mic-permissions-back":
      if (state.entryMode === "screen") {
        return { ...state, activeModalId: "room-entry" };
      } else {
        return { ...state, activeModalId: "enter-on-device" };
      }
    case "mic-access-granted":
    case "mic-access-denied":
      return { ...state, activeModalId: "mic-setup" };
    case "mic-setup-back":
      if (state.entryMode === "screen") {
        return { ...state, activeModalId: "room-entry" };
      } else {
        return { ...state, activeModalId: "enter-on-device" };
      }
  }
}

export function RoomEntryModalContainer({ hub, store, linkChannel, onEnter }) {
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
  } else if (activeModalId === "enter-on-device") {
    activeModal = (
      <EnterOnDeviceModalContainer
        linkChannel={linkChannel}
        onBack={() => dispatch({ type: "enter-on-device-back" })}
        onConnectedOnDevice={() => dispatch({ type: "connected-on-device" })}
        onEnterOnConnectedHeadset={() => dispatch({ type: "enter-on-connected-headset" })}
      />
    );
  } else if (activeModalId === "mic-permissions") {
    activeModal = (
      <MicPermissionsModalContainer
        store={store}
        onBack={() => dispatch({ type: "mic-permissions-back" })}
        onMicrophoneAccessGranted={() => dispatch({ type: "mic-access-granted" })}
        onMicrophoneAccessDenied={() => dispatch({ type: "mic-access-denied" })}
      />
    );
  } else if (activeModalId === "mic-setup") {
    activeModal = <MicSetupModal onBack={() => dispatch({ type: "mic-setup-back" })} />;
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
  store: PropTypes.object,
  hub: PropTypes.shape({
    name: PropTypes.string.isRequired
  }),
  linkChannel: PropTypes.object.isRequired,
  onEnter: PropTypes.func
};

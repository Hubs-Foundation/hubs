import React, { useState } from "react";
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

export function RoomEntryUI({ hub, linkChannel, onEnter }) {
  const [activeModalId, setActiveModalId] = useState("room-entry");

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
        onJoinRoom={() => setActiveModalId("mic-permissions")}
        onEnterOnDevice={() => setActiveModalId("enter-on-device")}
      />
    );
  } else if (activeModalId === "mic-permissions") {
    activeModal = <MicPermissionsModal onBack={() => setActiveModalId("room-entry")} />;
  } else if (activeModalId === "enter-on-device") {
    activeModal = <EnterOnDeviceUI linkChannel={linkChannel} onBack={() => setActiveModalId("room-entry")} />;
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

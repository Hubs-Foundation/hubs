/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as LeaveIcon } from "../icons/Leave.svg";
import { ReactComponent as MoreIcon } from "../icons/More.svg";
import { ToolbarButton, presets } from "./ToolbarButton";
import styleUtils from "../styles/style-utils.scss";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";

export default {
  title: "Input/Toolbar",
  argTypes: {
    selected: { control: "boolean" }
  }
};

export const AllButtons = args => (
  <Column padding>
    {presets.map(preset => (
      <ToolbarButton key={preset} icon={<ShareIcon />} label={preset} preset={preset} {...args} />
    ))}
    <ToolbarButton icon={<ShareIcon />} label="Share" preset="accent5" statusColor="recording" />
    <ToolbarButton icon={<MicrophoneIcon />} label="Voice" statusColor="enabled" />
  </Column>
);

AllButtons.parameters = {
  selected: false
};

export const RoomToolbar = () => (
  <RoomLayout
    toolbarLeft={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" />}
    toolbarCenter={
      <>
        <ToolbarButton icon={<MicrophoneIcon />} label="Voice" preset="basic" />
        <ToolbarButton icon={<ShareIcon />} label="Share" preset="accent5" />
        <ToolbarButton icon={<ObjectIcon />} label="Place" preset="accent3" />
        <ToolbarButton icon={<ReactionIcon />} label="React" preset="accent2" />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="accent4" />
      </>
    }
    toolbarRight={
      <>
        <ToolbarButton icon={<LeaveIcon />} label="Leave" preset="accent1" />
        <ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />
      </>
    }
  />
);

export const EntryToolbar = () => (
  <RoomLayout
    toolbarLeft={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" />}
    toolbarCenter={
      <>
        <ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" className={styleUtils.hideLg} />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="accent4" />
      </>
    }
    toolbarRight={<ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />}
  />
);

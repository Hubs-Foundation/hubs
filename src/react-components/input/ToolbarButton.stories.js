/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { ReactComponent as InviteIcon } from "../icons/Invite.svg";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as ArrowIcon } from "../icons/Arrow.svg";
import { ReactComponent as ShareIcon } from "../icons/Share.svg";
import { ReactComponent as ObjectIcon } from "../icons/Object.svg";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";
import { ReactComponent as ChatIcon } from "../icons/Chat.svg";
import { ReactComponent as LeaveIcon } from "../icons/Leave.svg";
import { ReactComponent as MoreIcon } from "../icons/More.svg";
import { ToolbarButton, presets, types } from "./ToolbarButton";
import styleUtils from "../styles/style-utils.scss";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";

export default {
  title: "Input/Toolbar",
  argTypes: {
    selected: { control: "boolean", defaultValue: false },
    disabled: { control: "boolean", defaultValue: false }
  }
};

export const AllButtons = args => (
  <Column padding>
    {presets.map(preset => (
      <ToolbarButton key={preset} icon={<ShareIcon />} label={preset} preset={preset} {...args} />
    ))}
    <ToolbarButton icon={<ShareIcon />} label="Share" preset="accent5" statusColor="recording" {...args} />
    <ToolbarButton icon={<MicrophoneIcon />} label="Voice" statusColor="enabled" {...args} />
  </Column>
);

AllButtons.argTypes = {
  type: {
    control: {
      type: "select",
      options: types
    },
    defaultValue: types[0]
  }
};

AllButtons.parameters = {
  selected: false,
  type: types[0],
  disabled: false
};

const containerStyles = {
  display: "flex"
};

export const RoomToolbar = args => (
  <RoomLayout
    toolbarLeft={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" {...args} />}
    toolbarCenter={
      <>
        <div style={containerStyles}>
          <ToolbarButton icon={<ArrowIcon />} preset="basic" type={"left"} {...args} />
          <ToolbarButton
            icon={<MicrophoneIcon />}
            label="Voice"
            type={"right"}
            statusColor={"enabled"}
            preset="basic"
            {...args}
          />
        </div>
        <ToolbarButton icon={<ShareIcon />} label="Share" preset="accent5" {...args} />
        <ToolbarButton icon={<ObjectIcon />} label="Place" preset="accent3" {...args} />
        <ToolbarButton icon={<ReactionIcon />} label="React" preset="accent2" {...args} />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="accent4" {...args} />
      </>
    }
    toolbarRight={
      <>
        <ToolbarButton icon={<LeaveIcon />} label="Leave" preset="accent1" {...args} />
        <ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" {...args} />
      </>
    }
  />
);

export const EntryToolbar = args => (
  <RoomLayout
    toolbarLeft={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" {...args} />}
    toolbarCenter={
      <>
        <ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" className={styleUtils.hideLg} {...args} />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="accent4" {...args} />
      </>
    }
    toolbarRight={<ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" {...args} />}
  />
);

import React from "react";
import { withDesign } from "storybook-addon-designs";
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
import { Toolbar } from "../layout/Toolbar";

export default {
  title: "Toolbar",
  decorators: [withDesign],
  argTypes: {
    selected: { control: "boolean" }
  }
};

export const AllButtons = ({ selected }) => (
  <>
    {presets.map(preset => (
      <ToolbarButton key={preset} icon={<ShareIcon />} label={preset} preset={preset} selected={selected} />
    ))}
  </>
);

AllButtons.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=17%3A725"
  },
  selected: false
};

export const RoomToolbar = () => (
  <Toolbar
    left={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" />}
    center={
      <>
        <ToolbarButton icon={<MicrophoneIcon />} label="Voice" preset="basic" />
        <ToolbarButton icon={<ShareIcon />} label="Share" preset="purple" />
        <ToolbarButton icon={<ObjectIcon />} label="Place" preset="green" />
        <ToolbarButton icon={<ReactionIcon />} label="React" preset="orange" />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="blue" />
      </>
    }
    right={
      <>
        <ToolbarButton icon={<LeaveIcon />} label="Leave" preset="red" />
        <ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />
      </>
    }
  />
);

RoomToolbar.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=17%3A667"
  }
};

export const EntryToolbar = () => (
  <Toolbar
    alwaysShowLeft
    left={<ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" />}
    center={
      <>
        <ToolbarButton icon={<InviteIcon />} label="Invite" preset="basic" className={styleUtils.hideMd} />
        <ToolbarButton icon={<ChatIcon />} label="Chat" preset="blue" />
      </>
    }
    right={<ToolbarButton icon={<MoreIcon />} label="More" preset="transparent" />}
  />
);

EntryToolbar.parameters = {
  design: {
    type: "figma",
    url: "https://www.figma.com/file/Xag5qaEgYs3KzXvoxx5m8y/Hubs-Redesign?node-id=61%3A4500"
  }
};

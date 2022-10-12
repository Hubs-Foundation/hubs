import React from "react";
import { withDesign } from "storybook-addon-designs";
import { ReactComponent as AudioIcon } from "./Audio.svg";
import { ReactComponent as AvatarIcon } from "./Avatar.svg";
import { ReactComponent as CameraIcon } from "./Camera.svg";
import { ReactComponent as CaretDownIcon } from "./CaretDown.svg";
import { ReactComponent as ChatIcon } from "./Chat.svg";
import { ReactComponent as ChevronBackIcon } from "./ChevronBack.svg";
import { ReactComponent as CloseIcon } from "./Close.svg";
import { ReactComponent as DeleteIcon } from "./Delete.svg";
import { ReactComponent as DesktopIcon } from "./Desktop.svg";
import { ReactComponent as DiscordIcon } from "./Discord.svg";
import { ReactComponent as DocumentIcon } from "./Document.svg";
import { ReactComponent as EnterIcon } from "./Enter.svg";
import { ReactComponent as GIFIcon } from "./GIF.svg";
import { ReactComponent as GoToIcon } from "./GoTo.svg";
import { ReactComponent as HelpIcon } from "./Help.svg";
import { ReactComponent as HideIcon } from "./Hide.svg";
import { ReactComponent as ImageIcon } from "./Image.svg";
import { ReactComponent as InviteIcon } from "./Invite.svg";
import { ReactComponent as LeaveIcon } from "./Leave.svg";
import { ReactComponent as LinkIcon } from "./Link.svg";
import { ReactComponent as MicrophoneIcon } from "./Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "./MicrophoneMuted.svg";
import { ReactComponent as MoreIcon } from "./More.svg";
import { ReactComponent as ObjectIcon } from "./Object.svg";
import { ReactComponent as ObjectsIcon } from "./Objects.svg";
import { ReactComponent as PenIcon } from "./Pen.svg";
import { ReactComponent as PeopleIcon } from "./People.svg";
import { ReactComponent as PhoneIcon } from "./Phone.svg";
import { ReactComponent as PinIcon } from "./Pin.svg";
import { ReactComponent as ReactionIcon } from "./Reaction.svg";
import { ReactComponent as SceneIcon } from "./Scene.svg";
import { ReactComponent as SettingsIcon } from "./Settings.svg";
import { ReactComponent as ShareIcon } from "./Share.svg";
import { ReactComponent as ShowIcon } from "./Show.svg";
import { ReactComponent as StarIcon } from "./Star.svg";
import { ReactComponent as TextIcon } from "./Text.svg";
import { ReactComponent as UploadIcon } from "./Upload.svg";
import { ReactComponent as VideoIcon } from "./Video.svg";
import { ReactComponent as VolumeHighIcon } from "./VolumeHigh.svg";
import { ReactComponent as VolumeMutedIcon } from "./VolumeMuted.svg";
import { ReactComponent as VolumeOffIcon } from "./VolumeOff.svg";
import { ReactComponent as VRIcon } from "./VR.svg";
import { ReactComponent as WandIcon } from "./Wand.svg";
import { ReactComponent as HmcLogo } from "./HmcLogo.svg";

export default {
  title: "Icon",
  decorators: [withDesign],
  argTypes: {
    color: { control: "color" }
  }
};

export const AllIcons = args => (
  <>
    <AudioIcon {...args} />
    <AvatarIcon {...args} />
    <CameraIcon {...args} />
    <CaretDownIcon {...args} />
    <ChatIcon {...args} />
    <ChevronBackIcon {...args} />
    <CloseIcon {...args} />
    <DeleteIcon {...args} />
    <DesktopIcon {...args} />
    <DiscordIcon {...args} />
    <DocumentIcon {...args} />
    <EnterIcon {...args} />
    <GIFIcon {...args} />
    <GoToIcon {...args} />
    <HelpIcon {...args} />
    <HideIcon {...args} />
    <HmcLogo {...args} />
    <ImageIcon {...args} />
    <InviteIcon {...args} />
    <LeaveIcon {...args} />
    <LinkIcon {...args} />
    <MicrophoneIcon {...args} />
    <MicrophoneMutedIcon {...args} />
    <MoreIcon {...args} />
    <ObjectIcon {...args} />
    <ObjectsIcon {...args} />
    <PenIcon {...args} />
    <PeopleIcon {...args} />
    <PhoneIcon {...args} />
    <PinIcon {...args} />
    <ReactionIcon {...args} />
    <SceneIcon {...args} />
    <SettingsIcon {...args} />
    <ShareIcon {...args} />
    <ShowIcon {...args} />
    <StarIcon {...args} />
    <TextIcon {...args} />
    <UploadIcon {...args} />
    <VideoIcon {...args} />
    <VolumeHighIcon {...args} />
    <VolumeMutedIcon {...args} />
    <VolumeOffIcon {...args} />
    <VRIcon {...args} />
    <WandIcon {...args} />
  </>
);

AllIcons.parameters = {
  color: "#000"
};

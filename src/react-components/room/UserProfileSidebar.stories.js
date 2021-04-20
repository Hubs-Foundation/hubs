import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { UserProfileSidebar } from "./UserProfileSidebar";

export default {
  title: "Room/UserProfileSidebar",
  parameters: {
    layout: "fullscreen"
  }
};

export const AllPermissions = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" isSignedIn canHide canKick canMute canPromote />} />
);

export const CanDemote = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" isSignedIn canHide canKick canMute canDemote />} />
);

export const CanUnhide = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" isSignedIn canHide isHidden />} />
);

export const NotSignedIn = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" isSignedIn canHide canKick canMute canPromote />} />
);

export const NotSignedInCanDemote = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" canHide canKick canMute canDemote />} />
);

export const NotSignedInCanUnhide = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" canHide isHidden />} />
);

export const NoPermissions = () => <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" />} />;

export const ShowBackButton = () => (
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" showBackButton isSignedIn canHide canKick canMute canPromote />}
  />
);

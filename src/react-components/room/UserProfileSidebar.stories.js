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
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" volume={4} isSignedIn canHide canKick canMute canPromote />}
  />
);

export const CanDemote = () => (
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" volume={4} isSignedIn canHide canKick canMute canDemote />}
  />
);

export const CanUnhide = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" volume={4} isSignedIn canHide isHidden />} />
);

export const NotSignedIn = () => (
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" volume={4} isSignedIn canHide canKick canMute canPromote />}
  />
);

export const NotSignedInCanDemote = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" volume={4} canHide canKick canMute canDemote />} />
);

export const NotSignedInCanUnhide = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" volume={4} canHide isHidden />} />
);

export const NoPermissions = () => <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" volume={4} />} />;

export const NetworkMuted = () => (
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" volume={4} isMuted isSignedIn canHide canKick canPromote />}
  />
);

export const LocalMuted = () => (
  <RoomLayout
    sidebar={<UserProfileSidebar displayName="Robert" volume={0} isSignedIn canHide canKick canMute canPromote />}
  />
);

export const ShowBackButton = () => (
  <RoomLayout
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        volume={4}
        showBackButton
        isSignedIn
        canHide
        canKick
        canMute
        canPromote
      />
    }
  />
);

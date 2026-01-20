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
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
        volume={4}
        isSignedIn
        canHide
        canKick
        canMute
        canPromote
      />
    }
  />
);

export const CanDemote = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
        volume={4}
        isSignedIn
        canHide
        canKick
        canMute
        canDemote
      />
    }
  />
);

export const CanUnhide = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={<UserProfileSidebar displayName="Robert" pronouns="he/him" volume={4} isSignedIn canHide isHidden />}
  />
);

export const NotSignedIn = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
        volume={4}
        isSignedIn
        canHide
        canKick
        canMute
        canPromote
      />
    }
  />
);

export const NotSignedInCanDemote = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={<UserProfileSidebar displayName="Robert" pronouns="he/him" volume={4} canHide canKick canMute canDemote />}
  />
);

export const NotSignedInCanUnhide = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={<UserProfileSidebar displayName="Robert" pronouns="he/him" volume={4} canHide isHidden />}
  />
);

export const NoPermissions = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={<UserProfileSidebar displayName="Robert" pronouns="he/him" volume={4} />}
  />
);

export const NetworkMuted = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
        volume={4}
        isMuted
        isSignedIn
        canHide
        canKick
        canPromote
      />
    }
  />
);

export const LocalMuted = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
        volume={0}
        isSignedIn
        canHide
        canKick
        canMute
        canPromote
      />
    }
  />
);

export const ShowBackButton = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <UserProfileSidebar
        displayName="Robert"
        pronouns="he/him"
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

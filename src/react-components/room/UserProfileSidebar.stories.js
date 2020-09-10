import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { UserProfileSidebar } from "./UserProfileSidebar";

export default {
  title: "UserProfileSidebar"
};

export const Base = () => (
  <RoomLayout sidebar={<UserProfileSidebar displayName="Robert" canHide canKick canMute canPromote />} />
);

Base.parameters = {
  layout: "fullscreen"
};

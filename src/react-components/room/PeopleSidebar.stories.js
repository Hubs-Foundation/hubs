import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { PeopleSidebar } from "./PeopleSidebar";

export default {
  title: "PeopleSidebar"
};

export const Base = () => <RoomLayout sidebar={<PeopleSidebar people={[]} />} />;

Base.parameters = {
  layout: "fullscreen"
};

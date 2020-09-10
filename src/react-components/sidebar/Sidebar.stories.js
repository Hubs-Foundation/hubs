import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { Sidebar } from "./Sidebar";

export default {
  title: "Sidebar"
};

export const Base = () => <RoomLayout sidebar={<Sidebar title="Sidebar">Test</Sidebar>} />;

Base.parameters = {
  layout: "fullscreen"
};

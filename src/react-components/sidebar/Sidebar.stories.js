/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";
import { Sidebar } from "./Sidebar";
import { BackButton } from "../input/BackButton";

export default {
  title: "Sidebar/Sidebar"
};

export const Base = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <Sidebar title="Sidebar Title" beforeTitle={<BackButton onClick={() => console.log("back button pressed")} />}>
        <Column padding>Column component</Column>
      </Sidebar>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};

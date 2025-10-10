/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";
import { Sidebar } from "./Sidebar";

export default {
  title: "Sidebar/Sidebar"
};

export const Base = () => (
  <RoomLayout
    viewport={<div style={{ height: "100vh" }} />}
    sidebar={
      <Sidebar title="Sidebar">
        <Column padding>Test</Column>
      </Sidebar>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};

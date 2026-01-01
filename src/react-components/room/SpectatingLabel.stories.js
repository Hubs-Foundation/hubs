import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SpectatingLabel } from "./SpectatingLabel";

export default {
  title: "Room/SpectatingLabel",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <RoomLayout
    viewport={
      <div style={{ position: "relative", width: "100%", height: "100vh", background: "#020202" }}>
        <SpectatingLabel name="Robert Long" />
      </div>
    }
  />
);

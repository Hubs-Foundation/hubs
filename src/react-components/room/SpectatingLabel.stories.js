import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SpectatingLabel } from "./SpectatingLabel";

export default {
  title: "Room/SpectatingLabel",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<SpectatingLabel name="Robert Long" />} />;

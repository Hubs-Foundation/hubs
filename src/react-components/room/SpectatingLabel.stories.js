import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SpectatingLabel } from "./SpectatingLabel";

export default {
  title: "SpectatingLabel",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => <RoomLayout modal={<SpectatingLabel name="Robert Long" />} />;

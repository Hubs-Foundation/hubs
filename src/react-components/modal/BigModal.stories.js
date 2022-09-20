/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";
import { BigModal } from "./BigModal";

export default {
  title: "Modal"
};

export const Base = () => (
  <RoomLayout
    modal={
      <BigModal title="Modal" disableFullscreen>
        <Column padding>Test</Column>
      </BigModal>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};

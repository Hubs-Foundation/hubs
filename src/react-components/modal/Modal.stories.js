/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { RoomLayout } from "../layout/RoomLayout";
import { Modal } from "./Modal";

export default {
  title: "Modal/Modal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <RoomLayout
    modal={
      <Modal title="Modal">
        <Column padding>Test</Column>
      </Modal>
    }
  />
);

Base.parameters = {
  layout: "fullscreen"
};

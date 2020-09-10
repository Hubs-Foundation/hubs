import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { Modal } from "./Modal";

export default {
  title: "Modal"
};

export const Base = () => <RoomLayout modal={<Modal title="Modal">Test</Modal>} />;

Base.parameters = {
  layout: "fullscreen"
};

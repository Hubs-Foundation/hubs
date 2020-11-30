import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SceneUrlModal } from "./SceneUrlModal";

export default {
  title: "SceneUrlModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const ValidUrl = () => <RoomLayout modal={<SceneUrlModal onValidateUrl={() => true} />} />;

export const InvalidUrl = () => <RoomLayout modal={<SceneUrlModal onValidateUrl={() => "Invalid Scene Url"} />} />;

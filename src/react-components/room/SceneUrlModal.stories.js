import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { SceneUrlModal } from "./SceneUrlModal";

export default {
  title: "Room/SceneUrlModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const ValidUrl = () => <RoomLayout modal={<SceneUrlModal onValidateUrl={() => true} />} />;

export const InvalidUrl = () => <RoomLayout modal={<SceneUrlModal onValidateUrl={() => "Invalid Scene Url"} />} />;

export const ValidUrlWithSpoke = () => (
  <RoomLayout modal={<SceneUrlModal enableSpoke editorName="Spoke" onValidateUrl={() => true} />} />
);

export const InvalidUrlWithSpoke = () => (
  <RoomLayout modal={<SceneUrlModal enableSpoke editorName="Spoke" onValidateUrl={() => "Invalid Scene Url"} />} />
);

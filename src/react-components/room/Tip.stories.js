import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { Tip } from "./Tip";

export default {
  title: "Room/Tip",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <RoomLayout
    viewport={
      <Tip onDismiss={() => {}} dismissLabel="Skip">
        {"Welcome to Mozilla Hubs! Let's take a quick tour. 👋 Click and drag to look around."}
      </Tip>
    }
  />
);

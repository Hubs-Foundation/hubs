import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useAccessibleOutlineStyle } from "../input/useAccessibleOutlineStyle";
import { RoomLoadingUI } from "./RoomLoadingUI";
import { RoomEntryUI } from "./RoomEntryUI";
import { InRoomUI } from "./InRoomUI";
import "../styles/global.scss";
import "./RoomUI.scss";

export function RoomUI({ scene, hub, linkChannel }) {
  useAccessibleOutlineStyle();

  useEffect(() => {
    const el = document.getElementById("preload-overlay");
    el.classList.add("loaded");

    // Remove the preload overlay after the animation has finished.
    const timeout = setTimeout(() => {
      el.remove();
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const [screen, setScreen] = useState("room-loading-ui");

  if (screen === "room-loading-ui") {
    return <RoomLoadingUI scene={scene} onLoaded={() => setScreen("room-entry-ui")} />;
  } else if (screen === "room-entry-ui") {
    return <RoomEntryUI linkChannel={linkChannel} hub={hub} onEnter={() => setScreen("in-room-ui")} />;
  }

  return <InRoomUI />;
}

RoomUI.propTypes = {
  linkChannel: PropTypes.object,
  scene: PropTypes.object.isRequired,
  hub: PropTypes.object
};

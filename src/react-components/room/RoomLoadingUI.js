import React, { useEffect } from "react";
import PropTypes from "prop-types";
import configs from "../../utils/configs";

import { LoadingScreen } from "./LoadingScreen";
import { useRoomLoadingState } from "./useRoomLoadingState";

//TODO: Make these configurable
const infoMessages = [
  { heading: "Tip:", message: "Press the Q & E keys to turn left and right." },
  {
    heading: "What's New?",
    message: (
      <>
        You can now set the default locale in your preferences.{" "}
        <a href="/whats-new" target="_blank">
          Read More
        </a>
      </>
    )
  }
];

export function RoomLoadingUI({ onLoaded, scene }) {
  const { loading, message } = useRoomLoadingState(scene);

  useEffect(
    () => {
      if (!loading) {
        onLoaded();
      }
    },
    [loading, onLoaded]
  );

  return <LoadingScreen logoSrc={configs.image("logo")} message={message} infoMessages={infoMessages} />;
}

RoomLoadingUI.propTypes = {
  scene: PropTypes.object.isRequired,
  onLoaded: PropTypes.func.isRequired
};

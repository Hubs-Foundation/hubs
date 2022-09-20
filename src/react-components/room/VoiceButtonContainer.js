import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { ReactComponent as MicrophoneIcon } from "../icons/Microphone.svg";
import { ReactComponent as MicrophoneMutedIcon } from "../icons/MicrophoneMuted.svg";
import { ToolbarButton } from "../input/ToolbarButton";
import { useMicrophone } from "./useMicrophone";
import { FormattedMessage } from "react-intl";

export function VoiceButtonContainer({ scene, microphoneEnabled, hubChannel }) {
  const [count, setCount] = useState(0);
  const handleClick = () => {
    // Hooksを用いているのでthisを使わなくてもstateを参照できる
    setCount(() => count + 1);
  };

  const buttonRef = useRef();

  const { isMuted, volume, toggleMute } = useMicrophone(scene);

  // if(!hubChannel.getVoiceReceiverSetFlag())
  // {
  //   hubChannel.setVoiceReceiver();
  // }

  useEffect(
    () => {
      const rect = buttonRef.current.querySelector("rect");

      if (volume < 0.05) {
        rect.setAttribute("height", 0);
      } else if (volume < 0.3) {
        rect.setAttribute("y", 8);
        rect.setAttribute("height", 4);
      } else {
        rect.setAttribute("y", 4);
        rect.setAttribute("height", 8);
      }

      // if (!isMuted) {
      //   handleClick();

      //   // send volume data three one time to decrease stress for reticulum
      //   if (count % 3 == 0) {

      //     if (hubChannel.getVolIntervalId() == 0) {
      //       hubChannel.activateMicVolumeSender();
      //     }

      //     hubChannel.updateMaxMicVolume(volume);
      //   }

      //   if (count == 10000) {
      //     count = 0;
      //   }
      // }
    },
    [volume, isMuted]
  );

  return (
    <ToolbarButton
      ref={buttonRef}
      icon={isMuted || !microphoneEnabled ? <MicrophoneMutedIcon /> : <MicrophoneIcon />}
      label={<FormattedMessage id="voice-button-container.label" defaultMessage="音声" />}
      preset="basic"
      onClick={toggleMute}
      statusColor={isMuted || !microphoneEnabled ? "red" : "green"}
    />
  );
}

VoiceButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired,
  microphoneEnabled: PropTypes.bool
};

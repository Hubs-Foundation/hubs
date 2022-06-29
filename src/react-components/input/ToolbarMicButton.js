import React, { useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { FormattedMessage } from "react-intl";
import { ToolbarButton } from "../input/ToolbarButton";
import { useVolumeMeter } from "../misc/useVolumeMeter";

export function ToolbarMicButton({ scene, ...rest }) {
  const ref = useRef();
  const setRef = useCallback(
    node => {
      ref.current = node;
    },
    [ref]
  );
  const update = useCallback(
    level => {
      const node = ref.current;
      if (node) {
        const rect = node.querySelector("rect");
        if (level <= 0.1) {
          rect.setAttribute("height", 0);
        } else if (level < 0.3) {
          rect.setAttribute("y", 8);
          rect.setAttribute("height", 4);
        } else {
          rect.setAttribute("y", 4);
          rect.setAttribute("height", 8);
        }
      }
    },
    [ref]
  );
  useVolumeMeter({
    analyser: scene.systems["hubs-systems"].audioSystem.outboundAnalyser,
    update
  });
  return (
    <ToolbarButton
      ref={setRef}
      label={<FormattedMessage id="voice-button-container.label" defaultMessage="Voice" />}
      preset="basic"
      type={"right"}
      {...rest}
    />
  );
}

ToolbarMicButton.propTypes = {
  scene: PropTypes.object.isRequired
};

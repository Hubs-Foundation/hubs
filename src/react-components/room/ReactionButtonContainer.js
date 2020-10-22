import React, { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { ReactComponent as ReactionIcon } from "../icons/Reaction.svg";
import { ToolbarButton } from "../input/ToolbarButton";

export function ReactionButtonContainer({ scene }) {
  const [isFrozen, setIsFrozen] = useState(scene.is("frozen"));

  useEffect(
    () => {
      function onSceneStateChange(event) {
        if (event.detail === "frozen") {
          setIsFrozen(scene.is("frozen"));
        }
      }

      scene.addEventListener("stateadded", onSceneStateChange);
      scene.addEventListener("stateremoved", onSceneStateChange);

      return () => {
        scene.removeEventListener("stateadded", onSceneStateChange);
        scene.removeEventListener("stateremoved", onSceneStateChange);
      };
    },
    [scene]
  );

  // TODO: We probably shouldn't use freeze mode for users spawning emojis on a 2d device.
  const toggleFreeze = useCallback(
    () => {
      scene.components["freeze-controller"].onToggle();
    },
    [scene]
  );

  return (
    <ToolbarButton icon={<ReactionIcon />} label="React" preset="orange" selected={isFrozen} onClick={toggleFreeze} />
  );
}

ReactionButtonContainer.propTypes = {
  scene: PropTypes.object.isRequired
};

import React from "react";
import PropTypes from "prop-types";

export const ReactAudioContext = React.createContext({});

export const hudHoverSound = "play_sound-hud_hover_start";

export const WithHoverSound = ({ sound, children }) => {
  return (
    <ReactAudioContext.Consumer>
      {context => {
        return React.cloneElement(children, {
          onMouseEnter: e => {
            if (context && context.playSound) {
              context.playSound(sound || hudHoverSound);
            }
            children.props.onMouseEnter && children.props.onMouseEnter(e);
          }
        });
      }}
    </ReactAudioContext.Consumer>
  );
};

WithHoverSound.propTypes = {
  children: PropTypes.object,
  sound: PropTypes.string
};

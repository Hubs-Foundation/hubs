import React from "react";
import PropTypes from "prop-types";

export const ReactAudioContext = React.createContext({});

export const WithHoverSound = ({ children }) => {
  return (
    <ReactAudioContext.Consumer>
      {() => {
        return React.cloneElement(children, {
          onMouseEnter: e => {
            // this is dead because we do not like hover sounds, will remove WithHoverSound later
            // const hudHoverSound = "play_sound-hud_hover_start";
            // if (context && context.playSound) {
            //  context.playSound(sound || hudHoverSound);
            // }
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

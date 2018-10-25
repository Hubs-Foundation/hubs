import React from "react";

export const AudioContext = React.createContext({});

export const hudHoverSound = "play_sound-hud_mouse_enter";

export const WithHoverSound = ({ sound, children }) => {
  return (
    <AudioContext.Consumer>
      {context => {
        return React.cloneElement(children, {
          onMouseEnter: e => {
            context.playSound(sound || hudHoverSound);
            children.props.onMouseEnter && children.props.onMouseEnter(e);
          }
        });
      }}
    </AudioContext.Consumer>
  );
};

import React, { useState } from "react";

export const SvgToggleButton = ({
  onToggle,
  active,
  normalProps,
  normalHoverProps,
  activeProps,
  activeHoverProps,
  style,
  ...otherProps
}) => {
  const [hover, setHover] = useState(false);

  const stateProps = (activated, hovered) => {
    const unhoveredProps = activated ? activeProps : normalProps;
    if (activeHoverProps && normalHoverProps)
      return hovered ? (activated ? activeHoverProps : normalHoverProps) : unhoveredProps;
    else return unhoveredProps;
  };

  return (
    <image
      draggable={"false"}
      onClick={() => {
        onToggle(!active);
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...style,
        cursor: "pointer"
      }}
      {...stateProps(active, hover)}
      {...otherProps}
    />
  );
};

export const SvgHoverButton = ({ normalProps, hoverProps, style, ...otherProps }) => {
  const [isShown, setIsShown] = useState(false);

  return (
    <image
      draggable={"false"}
      onMouseEnter={() => setIsShown(true)}
      onMouseLeave={() => setIsShown(false)}
      style={{
        ...style,
        cursor: "pointer"
      }}
      {...(isShown ? hoverProps : normalProps)}
      {...otherProps}
    />
  );
};

import React, { useState } from "react";

export const SvgToggleButton = ({ onToggle, active, normalProps, activeProps, style, ...otherProps }) => {

  return (
    <image
      draggable={"false"}
      onClick={() => {
        onToggle(!active);
      }}
      style={{
        ...style,
        cursor: "pointer"
      }}
      {...(active ? activeProps : normalProps)}
      {...otherProps}
      />
  ) };
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
      {...isShown ? hoverProps : normalProps}
      {...otherProps}
      />
  ) };

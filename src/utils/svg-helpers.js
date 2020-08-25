import React, { useState } from "react";

export const SvgToggleButton = ({ onToggle, active, normalProps, activeProps, style, ...otherProps }) => {
  const [toggle, setToggle] = useState(active);

  return (
    <image
      onClick={() => {
        setToggle(!toggle);
        onToggle(!toggle);
      }}
      style={{
        ...style,
        cursor: "pointer"
      }}
      {...toggle ? activeProps : normalProps}
      {...otherProps}
      />
  ) };
export const SvgHoverButton = ({ normalProps, hoverProps, style, ...otherProps }) => {
  const [isShown, setIsShown] = useState(false);

  return (
    <image
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

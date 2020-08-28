import React, { useEffect } from "react";
import { debounce } from "lodash";

export const TextForm = ({ value, onValueChange, style, ...otherProps }) => {
  const inputRef = React.createRef();
  const stopPropagation = e => e.stopPropagation();

  useEffect(() => {
    const capturedRef = inputRef.current;
    const intercepted = ["keydown", "keypress", "keyup"];
    intercepted.forEach(i => capturedRef.addEventListener(i, stopPropagation));
    return () => intercepted.forEach(i => capturedRef.removeEventListener(i, stopPropagation));
  });

  const bounced = debounce(async update => onValueChange(update), 2e3, { trailing: true, maxWait: 5e3 });

  return (
    <input
      ref={inputRef}
      type={"text"}
      style={{
        color: "white",
        fontSize: "5em",
        fontFamily: "perpertua-titling",
        background: "transparent",
        border: "none",
        ...style
      }}
      placeholder={value}
      onChange={({ target }) => {
        bounced(target.value);
      }}
      onSubmit={event => {
        bounced(event.target.value);
        event.preventDefault();
      }}
      {...otherProps}
    />
  );
};

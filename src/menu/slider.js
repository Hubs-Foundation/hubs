import React, { useState } from "react";
import { minBy } from "lodash";

export const Slider = ({ volume, onVolumeChange, style, ...otherProps }) => {
  const notches = [0, 25, 50, 75, 100];
  const boxWidth = 190;
  const sliderLeftOffset = 479;

  const sliderVolumeToX = v => sliderLeftOffset + notches.indexOf(v) * boxWidth;
  const wrapToNotch = v => minBy(notches, notch => Math.abs(notch - v));

  const [offset, setOffset] = useState(sliderVolumeToX(wrapToNotch(volume * 100)));

  const selectVolume = value => {
    onVolumeChange(value / 100);
    setOffset(sliderVolumeToX(value));
  };

  const ClickBox = value => (
    <rect
      style={{
        cursor: "pointer",
        ...style
      }}
      key={value}
      id={value}
      onClick={() => selectVolume(value)}
      x={sliderVolumeToX(value)}
      y={2351}
      width={190}
      height={70}
    />
  );

  return (
    <>
      {notches.map(ClickBox)}
      <image x={offset} y={2280} width={217} height={217} {...otherProps} />
    </>
  );
};

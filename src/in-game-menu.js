import React, { useState } from "react";

import { SvgHoverButton, SvgToggleButton } from "./utils/svg-helpers";

import styles from "./assets/stylesheets/shared.scss";

import Backplate from "./assets/menu/Backplate.png";
import HomeExit from "./assets/menu/Home_Exit.png";
import HomeExitHover from "./assets/menu/Home_Exit_Hover.png";
import LobbyExit from "./assets/menu/Lobby_Exit.png";
import LobbyExitHover from "./assets/menu/Lobby_Exit_Hover.png";
import MenuClosed from "./assets/menu/Menu_Closed.png";
import MenuOpen from "./assets/menu/Menu_Open_Eyeball.png";
import Report from "./assets/menu/Report.png";
import ReportHover from "./assets/menu/Report_Hover.png";
import Room1Button from "./assets/menu/Room_1_Button.png";
import Room1ButtonHover from "./assets/menu/Room_1_Button_Hover.png";
import Room2Button from "./assets/menu/Room_2_Button.png";
import Room2ButtonHover from "./assets/menu/Room_2_Button_Hover.png";
import Room3Button from "./assets/menu/Room_3_Button.png";
import Room3ButtonHover from "./assets/menu/Room_3_Button_Hover.png";
import SliderEye from "./assets/menu/Slider.png";
import { minBy } from "lodash";

const Slider = ({ volume, onVolumeChange, style, ...otherProps }) => {
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
      <image x={offset} y={2280} width={217} height={217} href={SliderEye} {...otherProps} />
    </>
  );
};

const WatchToggle = ({ watching, onToggle }) => {
  const baseProps = { y: "2771", width: "217", height: "217", href: SliderEye };
  return (
    <SvgToggleButton
      active={watching}
      onToggle={onToggle}
      normalProps={{ x: "756", ...baseProps }}
      activeProps={{ x: "520", ...baseProps }}
    />
  );
};

export const Menu = ({
  watching = false,
  hidden = true,
  volume = 0.9,
  onWatchToggle,
  onMenuToggle,
  onVolumeChange,
  onReport,
  onHome,
  onLobby,
  onRoom1,
  onRoom2,
  onRoom3,
  style,
  ...otherProps
}) => {
  return (
    <svg
      width={1865}
      height={4689}
      draggable={"false"}
      style={{
        ...style
      }}
    >
      <SvgToggleButton
        active={!hidden}
        onToggle={onMenuToggle}
        normalProps={{ x: "1034", y: "132", width: "738", height: "734", href: MenuClosed }}
        activeProps={{ x: "1044", y: "134", width: "726", height: "727", href: MenuOpen }}
      />

      {!hidden && (
        <>
          <image
            style={{ pointerEvents: "none" }}
            draggable={false}
            x={218}
            y={486}
            width={1461}
            height={3828}
            href={Backplate}
          />

          <WatchToggle watching={watching} onToggle={onWatchToggle} />

          <Slider volume={volume} onVolumeChange={onVolumeChange} />

          <SvgHoverButton
            id="Report"
            onClick={onReport}
            normalProps={{ x: "478", y: "3098", width: "938", height: "461", href: Report }}
            hoverProps={{ x: "478", y: "3098", width: "938", height: "461", href: ReportHover }}
          />
          <SvgHoverButton
            id="HomeExit"
            onClick={onHome}
            normalProps={{ x: "1032", y: "3981", width: "336", height: "475", href: HomeExit }}
            hoverProps={{ x: "1022", y: "3974", width: "353", height: "491", href: HomeExitHover }}
          />
          <SvgHoverButton
            id="LobbyExit"
            onClick={onLobby}
            normalProps={{ x: "460", y: "3965", width: "475", height: "475", href: LobbyExit }}
            hoverProps={{ x: "518", y: "3974", width: "353", height: "491", href: LobbyExitHover }}
          />
          <SvgHoverButton
            id="Room1Button"
            onClick={onRoom1}
            hoverProps={{ x: "473", y: "3609", width: "281", height: "281", href: Room1ButtonHover }}
            normalProps={{ x: "486", y: "3624", width: "251", height: "251", href: Room1Button }}
          />
          <SvgHoverButton
            id="Room2Button"
            onClick={onRoom2}
            hoverProps={{ x: "826", y: "3609", width: "281", height: "280", href: Room2ButtonHover }}
            normalProps={{ x: "839", y: "3623", width: "251", height: "251", href: Room2Button }}
          />
          <SvgHoverButton
            id="Room3Button"
            onClick={onRoom3}
            hoverProps={{ x: "1178", y: "3605", width: "281", height: "281", href: Room3ButtonHover }}
            normalProps={{ x: "1191", y: "3620", width: "251", height: "251", href: Room3Button }}
          />
        </>
      )}
    </svg>
  );
};

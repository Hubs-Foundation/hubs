import React, { useState, useEffect } from "react";
import { SvgHoverButton, SvgToggleButton } from "../utils/svg-helpers";
import { TextForm } from "./text-form";
import { Slider } from "./slider";

import { inLobby } from "../room-metadata";

import Backplate from "../assets/menu/Backplate.png";
import HomeExit from "../assets/menu/Home_Exit.png";
import HomeExitHover from "../assets/menu/Home_Exit_Hover.png";
import LobbyExit from "../assets/menu/Lobby_Exit.png";
import LobbyExitHover from "../assets/menu/Lobby_Exit_Hover.png";
import MenuClosed from "../assets/menu/Menu_Closed.png";
import MenuOpen from "../assets/menu/Menu_Open_Eyeball.png";
import Report from "../assets/menu/Report.png";
import SliderEye from "../assets/menu/Slider.png";

import ReportHover from "../assets/menu/Report_Hover.png";
import Room1Button from "../assets/menu/Room_1_Button.png";
import Room1ButtonHover from "../assets/menu/Room_1_Button_Hover.png";
import Room2Button from "../assets/menu/Room_2_Button.png";
import Room2ButtonHover from "../assets/menu/Room_2_Button_Hover.png";
import Room3Button from "../assets/menu/Room_3_Button.png";
import Room3ButtonHover from "../assets/menu/Room_3_Button_Hover.png";

import MicrophoneOff from "../assets/menu/MicrophoneOff.png";
import MicrophoneOffHover from "../assets/menu/MicrophoneOff_Hover.png";
import MicrophoneOn from "../assets/menu/MicrophoneOn.png";
import MicrophoneOnHover from "../assets/menu/MicrophoneOn.png";

const nameX = 500;
const nameY = 1110;
const nameWidth = 915;
const nameHeight = 153;

const doofstickX = 269;
const doofstickY = 975;
const doofstickWidth = 915;
const doofstickHeight = 550;

const paneWidth = 1865;
const paneHeight = 4689;

export const Menu = ({
  watching = false,
  hidden = true,
  muted = true,
  volume = 0.9,
  name,
  onMenuToggle,
  onMuteToggle,
  onNameChange,
  onWatchToggle,
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
  // let vw = 1920; //, vh
  const [vw, setVw] = useState(1920);

  useEffect(() => {
    setVw(Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0));
    // vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  }, []);

  const svgScale = 0.2;
  const SVG_WIDTH = 1865;

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

  const MuteButton = (muted, onMuteToggle) => {
    const mutePosition = {
      x: 1120,
      y: 2752,
      width: 238,
      height: 238
    };

    return inLobby() && !watching && (
      <SvgToggleButton
        active={muted}
        onToggle={onMuteToggle}
        activeProps={{ ...mutePosition, href: MicrophoneOff }}
        activeHoverProps={{ ...mutePosition, href: MicrophoneOffHover }}
        normalProps={{ ...mutePosition, href: MicrophoneOn }}
        normalHoverProps={{ ...mutePosition, href: MicrophoneOnHover }}
      />
    );
  };

  return (
    <div
      id="menu-container"
      style={{
        transform: `scale(${(svgScale * SVG_WIDTH) / vw})`,
        transformOrigin: "top",
        position: "fixed",
        // top: 0,
        // right: 0,
        width: "30%",
        height: "100%"
      }}
    >
      <div id="svg-container" style={{ position: "absolute", top: 0, right: 0, width: "100%", height: "100%" }}>
        <svg
          width={SVG_WIDTH}
          height={4689}
          draggable={"false"}
          style={{
            transform: "scale(0.4)",
            transformOrigin: "top left",
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
              <MuteButton muted={muted} onMuteToggle={onMuteToggle} />

              <Slider href={SliderEye} volume={volume} onVolumeChange={onVolumeChange} />

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
      </div>

      {!hidden && (
        <div id="input-container" style={{ width: "100%", height: "100%", position: "absolute" }}>
          <TextForm
            value={name}
            onValueChange={onNameChange}
            x={nameX}
            y={nameY}
            width={nameWidth}
            height={nameHeight}
            minLength={1}
            maxLength={64}
          />
        </div>
      )}
    </div>
  );
};

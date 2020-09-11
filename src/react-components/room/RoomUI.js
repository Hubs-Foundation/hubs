import React from "react";
import { RoomLayout } from "../layout/RoomLayout";
import { useAccessibleOutlineStyle } from "../input/useAccessibleOutlineStyle";
import "../styles/global.scss";
import "./RoomUI.scss";

export function RoomUI() {
  useAccessibleOutlineStyle();
  return <RoomLayout />;
}

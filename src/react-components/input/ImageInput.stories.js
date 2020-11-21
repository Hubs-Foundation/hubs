import React from "react";
import { Column } from "../layout/Column";
import { ImageInput } from "./ImageInput";
import thumbnailUrl from "../../assets/background.jpg";

export default {
  title: "ImageInput",
  parameters: {
    layout: "fullscreen"
  }
};

export const Base = () => (
  <Column padding>
    <ImageInput label="Image" onChange={() => {}} />
  </Column>
);

export const Thumbnail = () => (
  <Column padding>
    <ImageInput label="Image" thumbnailUrl={thumbnailUrl} onChange={() => {}} />
  </Column>
);

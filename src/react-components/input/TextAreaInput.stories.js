import React from "react";
import { TextAreaInput } from "./TextAreaInput";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { IconButton } from "./IconButton";

export default {
  title: "TextAreaInput"
};

const multilineText = `Multiline
Text`;

export const All = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
    <TextAreaInput />
    <TextAreaInput placeholder="Placeholder Text" />
    <TextAreaInput value="Example Text" />
    <TextAreaInput value={multilineText} />
    <TextAreaInput value="Invalid Text" invalid />
    <TextAreaInput value="Disabled Text" disabled />
    <TextAreaInput
      placeholder="Search..."
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <TextAreaInput
      value={multilineText}
      invalid
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <TextAreaInput
      value={multilineText}
      invalid
      beforeInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
  </div>
);

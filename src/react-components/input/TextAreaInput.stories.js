import React from "react";
import { TextAreaInput } from "./TextAreaInput";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { IconButton } from "./IconButton";
import { Column } from "../layout/Column";

export default {
  title: "Input/TextAreaInput"
};

const multilineText = `Multiline
Text`;

export const All = () => (
  <Column padding>
    <TextAreaInput id="textarea-1" />
    <TextAreaInput id="textarea-2" placeholder="Placeholder Text" />
    <TextAreaInput id="textarea-3" value="Example Text" />
    <TextAreaInput id="textarea-4" value={multilineText} />
    <TextAreaInput id="textarea-5" value="Invalid Text" invalid />
    <TextAreaInput id="textarea-6" value="Disabled Text" disabled />
    <TextAreaInput
      id="textarea-7"
      placeholder="Search..."
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <TextAreaInput
      id="textarea-8"
      value={multilineText}
      invalid
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <TextAreaInput
      id="textarea-9"
      value={multilineText}
      invalid
      beforeInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
  </Column>
);

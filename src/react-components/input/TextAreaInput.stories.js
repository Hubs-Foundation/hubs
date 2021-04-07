/* eslint-disable @calm/react-intl/missing-formatted-message */
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
  </Column>
);

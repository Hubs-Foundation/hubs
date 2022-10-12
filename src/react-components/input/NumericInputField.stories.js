/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { NumericInputField } from "./NumericInputField";
import { Button } from "./Button";
import { ReactComponent as WandIcon } from "../icons/Wand.svg";
import { IconButton } from "./IconButton";
import { Column } from "../layout/Column";

export default {
  title: "Input/NumericInputField"
};

export const All = () => (
  <Column padding>
    <NumericInputField />
    <NumericInputField placeholder="Placeholder Text" />
    <NumericInputField value={123} />
    <NumericInputField value={123} invalid />
    <NumericInputField value={123} disabled />
    <NumericInputField placeholder="Disabled Placeholder Text" disabled />
    <NumericInputField placeholder="Labeled Input" label="With Label" />
    <NumericInputField label="Max Users" description="Must be a positive number." />
    <NumericInputField value="Invalid Text" label="With Label" invalid error="Error value invalid" />
    <NumericInputField
      label="Max Users"
      value={25}
      description={<a href="#">Learn More</a>}
      afterInput={<Button preset="accept">Apply</Button>}
    />
    <NumericInputField
      label="Max Users"
      value={25}
      description={<a href="#">Learn More</a>}
      beforeInput={<Button preset="accept">Apply</Button>}
    />
    <NumericInputField placeholder="Placeholder..." afterInput={<Button>Action</Button>} />
    <NumericInputField
      placeholder="Placeholder..."
      afterInput={<Button>Action</Button>}
      invalid
      error="Error with action."
    />
    <NumericInputField
      placeholder="Placeholder..."
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
    />
    <NumericInputField
      value={3}
      invalid
      afterInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
      error="Network error. Please try again."
    />
    <NumericInputField
      value={3}
      invalid
      beforeInput={
        <IconButton>
          <WandIcon />
        </IconButton>
      }
      error="Network error. Please try again."
    />
  </Column>
);

/* eslint-disable @calm/react-intl/missing-formatted-message */
import React from "react";
import { Column } from "../layout/Column";
import { Button, presets } from "./Button";

export default {
  title: "Input/Button"
};

export const All = () => (
  <Column padding>
    {presets.map(preset => (
      <Button key={preset} preset={preset}>
        {preset.replace(/^\w/, c => c.toUpperCase())}
      </Button>
    ))}
    <Button disabled>Disabled</Button>
    <Button>Really Really Long Button Name</Button>
  </Column>
);

export const Sizes = () => (
  <Column padding>
    <Button preset="primary" sm>
      Small
    </Button>
    <Button preset="primary" lg>
      Large? (lg)
    </Button>
    <Button preset="primary" xl>
      xlarge
    </Button>
    <Button preset="primary" thin>
      thin
    </Button>
    <Button disabled>Disabled</Button>
  </Column>
);

export const Tokens = () => (
  <Column padding>
    <Button preset="primary" sm thin>
      Create Token
    </Button>
    <Button disabled sm thin>
      Revoke all
    </Button>
  </Column>
);

export const Landing = () => (
  <Column padding>
    <Button preset="signin" thick>
      Sign in/Sign up
    </Button>
    <Button preset="landing" thick>
      Get Started
    </Button>
    <Button preset="landing" thin>
      Have a room code?
    </Button>
  </Column>
);

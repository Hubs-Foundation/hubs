import React from "react";
import { Center } from "../layout/Center";
import { Page } from "../layout/Page";
import { TokensModal } from "./TokensModal";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "TokensModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Tokens = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <TokensModal>
        <p>{"This is some content"}</p>
      </TokensModal>
    </Center>
  </Page>
);

import React from "react";
import { Center } from "../layout/Center";
import { Page } from "../layout/Page";
import { VerifyModal, EmailVerifying, EmailVerified, VerificationError } from "./VerifyModal";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "VerifyModal"
};

export const Verifying = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <EmailVerifying />
      </VerifyModal>
    </Center>
  </Page>
);

Verifying.parameters = {
  layout: "fullscreen"
};

export const Verified = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <EmailVerified origin="hubs.mozilla.com" />
      </VerifyModal>
    </Center>
  </Page>
);

Verified.parameters = {
  layout: "fullscreen"
};

export const Error = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <VerificationError />
      </VerifyModal>
    </Center>
  </Page>
);

Error.parameters = {
  layout: "fullscreen"
};

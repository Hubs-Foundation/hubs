import React from "react";
import { Center } from "../layout/Center";
import { Page } from "../layout/Page";
import { VerifyModal, VerifyingEmail, EmailVerified, VerificationError } from "./VerifyModal";
import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Auth/VerifyModal",
  parameters: {
    layout: "fullscreen"
  }
};

export const Verifying = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <VerifyingEmail />
      </VerifyModal>
    </Center>
  </Page>
);

export const Verified = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <EmailVerified origin="hubs.mozilla.com" />
      </VerifyModal>
    </Center>
  </Page>
);

export const Error = () => (
  <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
    <Center>
      <VerifyModal>
        <VerificationError />
      </VerifyModal>
    </Center>
  </Page>
);

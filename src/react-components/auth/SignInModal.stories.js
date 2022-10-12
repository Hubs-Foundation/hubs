import React from "react";
import { TERMS, PRIVACY } from "../../constants";
// import { Center } from "../layout/Center";
// import { Page } from "../layout/Page";
import { RoomLayout } from "../layout/RoomLayout";
import { SignInModal, SubmitEmail, WaitForVerification } from "./SignInModal";
// import backgroundUrl from "../../assets/images/home-hero-background-unbranded.png";

export default {
  title: "Auth/SignInModal",
  parameters: {
    layout: "fullscreen"
  }
};

// TODO: Page contains global typography styles which conflict with all the other stories.
// Uncomment this code when we migrate the Page component to the new design.
// export const PageSubmit = () => (
//   <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
//     <Center>
//       <SignInModal disableFullscreen>
//         <SubmitEmail
//           termsUrl={TERMS}
//           showTerms
//           privacyUrl={PRIVACY}
//           showPrivacy
//         />
//       </SignInModal>
//     </Center>
//   </Page>
// );

// export const PageWaitForVerification = () => (
//   <Page style={{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: "cover" }}>
//     <Center>
//       <SignInModal disableFullscreen>
//         <WaitForVerification email="example@example.com" showNewsletterSignup />
//       </SignInModal>
//     </Center>
//   </Page>
// );

export const RoomSubmit = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <SubmitEmail termsUrl={TERMS} privacyUrl={PRIVACY} />
      </SignInModal>
    }
  />
);

export const RoomSubmitNoTOS = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <SubmitEmail privacyUrl={PRIVACY} />
      </SignInModal>
    }
  />
);

export const RoomSubmitNoPrivacyPolicy = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <SubmitEmail termsUrl={TERMS} />
      </SignInModal>
    }
  />
);

export const RoomSubmitNoTOSOrPrivacyPolicy = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <SubmitEmail />
      </SignInModal>
    }
  />
);

export const RoomWaitForVerification = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <WaitForVerification email="example@example.com" showNewsletterSignup />
      </SignInModal>
    }
  />
);

export const RoomWaitForVerificationNoNewsletterSignup = () => (
  <RoomLayout
    modal={
      <SignInModal closeable>
        <WaitForVerification email="example@example.com" />
      </SignInModal>
    }
  />
);

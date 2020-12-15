import React from "react";
import PropTypes from "prop-types";
import "./Page.scss";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Page({
  showCloud,
  enableSpoke,
  editorName,
  showDocsLink,
  docsUrl,
  showSourceLink,
  showCommunityLink,
  communityUrl,
  isAdmin,
  isSignedIn,
  email,
  onSignOut,
  hidePoweredBy,
  showWhatsNewLink,
  showTerms,
  termsUrl,
  showPrivacy,
  privacyUrl,
  showCompanyLogo,
  companyLogoUrl,
  children,
  ...rest
}) {
  return (
    <>
      <Header
        showCloud={showCloud}
        enableSpoke={enableSpoke}
        editorName={editorName}
        showDocsLink={showDocsLink}
        docsUrl={docsUrl}
        showSourceLink={showSourceLink}
        showCommunityLink={showCommunityLink}
        communityUrl={communityUrl}
        isAdmin={isAdmin}
        isSignedIn={isSignedIn}
        email={email}
        onSignOut={onSignOut}
      />
      <main {...rest}>{children}</main>
      <Footer
        hidePoweredBy={hidePoweredBy}
        showWhatsNewLink={showWhatsNewLink}
        showTerms={showTerms}
        termsUrl={termsUrl}
        showPrivacy={showPrivacy}
        privacyUrl={privacyUrl}
        showCompanyLogo={showCompanyLogo}
        companyLogoUrl={companyLogoUrl}
      />
    </>
  );
}

Page.propTypes = {
  showCloud: PropTypes.bool,
  enableSpoke: PropTypes.bool,
  editorName: PropTypes.string,
  showDocsLink: PropTypes.bool,
  docsUrl: PropTypes.string,
  showSourceLink: PropTypes.bool,
  showCommunityLink: PropTypes.bool,
  communityUrl: PropTypes.string,
  isAdmin: PropTypes.bool,
  isSignedIn: PropTypes.bool,
  email: PropTypes.string,
  onSignOut: PropTypes.func,
  hidePoweredBy: PropTypes.bool,
  showWhatsNewLink: PropTypes.bool,
  showTerms: PropTypes.bool,
  termsUrl: PropTypes.string,
  showPrivacy: PropTypes.bool,
  privacyUrl: PropTypes.string,
  showCompanyLogo: PropTypes.bool,
  companyLogoUrl: PropTypes.string,
  children: PropTypes.node
};

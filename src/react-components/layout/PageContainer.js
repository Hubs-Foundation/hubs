import React, { useContext } from "react";
import PropTypes from "prop-types";
import { Page } from "./Page";
import { AuthContext } from "../auth/AuthContext";
import configs from "../../utils/configs";
import { getAppLogo } from "../../utils/get-app-logo";
import { useAccessibleOutlineStyle } from "../input/useAccessibleOutlineStyle";

export function PageContainer({ children, ...rest }) {
  const auth = useContext(AuthContext);
  useAccessibleOutlineStyle();
  //using show cloud as a proxy for if we are on hmc
  const isHmc = configs.feature("show_cloud");
  return (
    <Page
      appLogo={getAppLogo()}
      showCloud={configs.feature("show_cloud")}
      enableSpoke={configs.feature("enable_spoke")}
      editorName={configs.translation("editor-name")}
      showDocsLink={configs.feature("show_docs_link")}
      docsUrl={configs.link("docs", "https://hubs.mozilla.com/docs")}
      showSourceLink={configs.feature("show_source_link")}
      showCommunityLink={configs.feature("show_community_link")}
      communityUrl={configs.link("community", "https://discord.gg/dFJncWwHun")}
      isAdmin={auth.isAdmin}
      isSignedIn={auth.isSignedIn}
      email={auth.email}
      onSignOut={auth.signOut}
      hidePoweredBy={configs.feature("hide_powered_by")}
      showWhatsNewLink={configs.feature("show_whats_new_link")}
      showTerms={configs.feature("show_terms")}
      termsUrl={configs.link("terms_of_use", "https://github.com/mozilla/hubs/blob/master/TERMS.md")}
      showPrivacy={configs.feature("show_privacy")}
      privacyUrl={configs.link("privacy_notice", "https://github.com/mozilla/hubs/blob/master/PRIVACY.md")}
      showCompanyLogo={configs.feature("show_company_logo")}
      companyLogoUrl={configs.image("company_logo")}
      showDiscordBotLink={configs.feature("show_discord_bot_link")}
      appName={configs.translation("app-name")}
      isHmc={isHmc}
      {...rest}
    >
      {children}
    </Page>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node
};

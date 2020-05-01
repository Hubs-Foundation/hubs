import React, { useContext } from "react";
import { useLocation, Redirect } from "react-router";
import { FormattedMessage, addLocaleData } from "react-intl";
import en from "react-intl/locale-data/en";
import classNames from "classnames";
import configs from "../../utils/configs";
import IfFeature from "../if-feature";
import { Page } from "../layout/Page";
import MediaTiles from "../media-tiles";
import { CreateRoomButton } from "../input/CreateRoomButton";
import { PWAButton } from "../input/PWAButton";
import { useFeaturedRooms } from "./useFeaturedRooms";
import styles from "../../assets/stylesheets/index.scss";
import mediaBrowserStyles from "../../assets/stylesheets/media-browser.scss";
import discordLogoSmall from "../../assets/images/discord-logo-small.png";
import { AuthContext } from "../auth/AuthContext";

addLocaleData([...en]);

export function HomePage() {
  const location = useLocation();
  const qs = new URLSearchParams(location.search);
  const featuredRooms = useFeaturedRooms();
  const auth = useContext(AuthContext);

  // Support legacy sign in urls.
  if (qs.has("sign_in")) {
    return <Redirect to={{ pathname: "/signin", search: location.search }} />;
  } else if (qs.has("auth_topic")) {
    return <Redirect to={{ pathname: "/verify", search: location.search }} />;
  }

  if (qs.has("new")) {
    return <Redirect to="/new" />;
  }

  const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;

  return (
    <Page>
      <div className={styles.heroContent} style={{ backgroundImage: configs.image("home_background", true) }}>
        <div className={styles.heroPanel}>
          <div className={styles.container}>
            <div className={classNames([styles.logo, styles.logoMargin])}>
              <img src={configs.image("logo")} />
            </div>
            {featuredRooms.length === 0 && (
              <div className={styles.blurb}>
                <FormattedMessage id="app-description" />
              </div>
            )}
          </div>
          <div className={styles.ctaButtons}>
            {canCreateRooms && <CreateRoomButton />}
            <PWAButton />
          </div>
        </div>
        {featuredRooms.length > 0 && (
          <div className={styles.heroPanel}>
            <div className={classNames([mediaBrowserStyles.mediaBrowser, mediaBrowserStyles.mediaBrowserInline])}>
              <div className={classNames([mediaBrowserStyles.box, mediaBrowserStyles.darkened])}>
                <MediaTiles entries={featuredRooms} urlSource="favorites" />
              </div>
            </div>
          </div>
        )}
        <div className={classNames(styles.heroPanel, styles.rightPanel)}>
          <div>
            <div className={styles.secondaryLink}>
              <a href="/link">
                <FormattedMessage id="home.have_code" />
              </a>
            </div>

            <IfFeature name="show_discord_bot_link">
              <div className={styles.secondaryLink}>
                <div>
                  <FormattedMessage id="home.add_to_discord_1" />
                </div>
                <img src={discordLogoSmall} />
                <a href="/discord">
                  <FormattedMessage id="home.add_to_discord_2" />
                </a>
                <div>
                  <FormattedMessage id="home.add_to_discord_3" />
                </div>
              </div>
            </IfFeature>
          </div>
        </div>
      </div>
    </Page>
  );
}

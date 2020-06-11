import React, { useContext } from "react";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import configs from "../../utils/configs";
import IfFeature from "../if-feature";
import { Page } from "../layout/Page";
import MediaTiles from "../media-tiles";
import { CreateRoomButton } from "../input/CreateRoomButton";
import { PWAButton } from "../input/PWAButton";
import { useFeaturedRooms } from "./useFeaturedRooms";
import styles from "./HomePage.scss";
import mediaBrowserStyles from "../../assets/stylesheets/media-browser.scss";
import discordLogoSmall from "../../assets/images/discord-logo-small.png";
import { AuthContext } from "../auth/AuthContext";
import { useHomePageRedirect } from "./useHomePageRedirect";

export function HomePage() {
  useHomePageRedirect();
  const featuredRooms = useFeaturedRooms();
  const auth = useContext(AuthContext);

  const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;

  return (
    <Page className={styles.homePage}>
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

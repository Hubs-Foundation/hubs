import React, { useContext, useEffect } from "react";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import configs from "../../utils/configs";
import IfFeature from "../if-feature";
import { CreateRoomButton } from "./CreateRoomButton";
import { PWAButton } from "./PWAButton";
import { useFavoriteRooms } from "./useFavoriteRooms";
import { usePublicRooms } from "./usePublicRooms";
import styles from "./HomePage.scss";
import discordLogoUrl from "../../assets/images/discord-logo-small.png";
import { AuthContext } from "../auth/AuthContext";
import { createAndRedirectToNewHub } from "../../utils/phoenix-utils";
import { MediaGrid } from "../room/MediaGrid";
import { MediaTile } from "../room/MediaTiles";
import { PageContainer } from "../layout/PageContainer";
import { scaledThumbnailUrlFor } from "../../utils/media-url-utils";

export function HomePage() {
  const auth = useContext(AuthContext);

  const { results: favoriteRooms } = useFavoriteRooms();
  const { results: publicRooms } = usePublicRooms();

  const featuredRooms = Array.from(new Set([...favoriteRooms, ...publicRooms])).sort(
    (a, b) => b.member_count - a.member_count
  );

  useEffect(() => {
    const qs = new URLSearchParams(location.search);

    // Support legacy sign in urls.
    if (qs.has("sign_in")) {
      const redirectUrl = new URL("/signin", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    } else if (qs.has("auth_topic")) {
      const redirectUrl = new URL("/verify", window.location);
      redirectUrl.search = location.search;
      window.location = redirectUrl;
    }

    if (qs.has("new")) {
      createAndRedirectToNewHub(null, null, true);
    }
  }, []);

  const canCreateRooms = !configs.feature("disable_room_creation") || auth.isAdmin;

  const pageStyle = { backgroundImage: configs.image("home_background", true) };

  const logoUrl = configs.image("logo");

  const showDescription = featuredRooms.length === 0;

  const logoStyles = classNames(styles.logoContainer, {
    [styles.centerLogo]: !showDescription
  });

  return (
    <PageContainer className={styles.homePage} style={pageStyle}>
      <section>
        <div className={styles.appInfo}>
          <div className={logoStyles}>
            <img src={logoUrl} />
          </div>
          {showDescription && (
            <div className={styles.appDescription}>
              <FormattedMessage
                id="app-description"
                defaultMessage="Share a virtual room with friends.\nWatch videos, play with 3D objects, or just hang out."
              />
            </div>
          )}
        </div>
        <div className={styles.ctaButtons}>
          {canCreateRooms && <CreateRoomButton />}
          <PWAButton />
        </div>
      </section>
      {featuredRooms.length === 0 && (
        <IfFeature name="show_feature_panels">
          <section className={classNames(styles.features, styles.colLg, styles.centerLg)}>
            <div className={styles.center}>
              <h3>
                <FormattedMessage id="home.rooms-title" defaultMessage="Instantly create rooms" />
              </h3>
              <img src={configs.image("landing_rooms_thumb")} />
              <p>
                <FormattedMessage
                  id="home.rooms-blurb"
                  defaultMessage="Share virtual spaces with your friends, co-workers, and communities. When you create a room with Hubs, you’ll have a private virtual meeting space that you can instantly share - no downloads or VR headset necessary."
                />
              </p>
            </div>
            <div className={styles.center}>
              <h3>
                <FormattedMessage id="home.communicate-title" defaultMessage="Communicate naturally" />
              </h3>
              <img src={configs.image("landing_communicate_thumb")} />
              <p>
                <FormattedMessage
                  id="home.communicate-blurb"
                  defaultMessage="Choose an avatar to represent you, put on your headphones, and jump right in. Hubs makes it easy to stay connected with voice and text chat to other people in your private room."
                />
              </p>
            </div>
            <div className={styles.center}>
              <h3>
                <FormattedMessage id="home.media-title" defaultMessage="An easier way to share media" />
              </h3>
              <img src={configs.image("landing_media_thumb")} />
              <p>
                <FormattedMessage
                  id="home.media-blurb"
                  defaultMessage="Share content with others in your room by dragging and dropping photos, videos, PDF files, links, and 3D models into your space."
                />
              </p>
            </div>
          </section>
        </IfFeature>
      )}
      {featuredRooms.length > 0 && (
        <section className={styles.featuredRooms}>
          <MediaGrid center>
            {featuredRooms.map(room => {
              return (
                <MediaTile
                  key={room.id}
                  entry={room}
                  processThumbnailUrl={(entry, width, height) =>
                    scaledThumbnailUrlFor(entry.images.preview.url, width, height)
                  }
                />
              );
            })}
          </MediaGrid>
        </section>
      )}
      <section>
        <div className={styles.secondaryLinks}>
          <a href="/link">
            <FormattedMessage id="home.have-code" defaultMessage="Have a room code?" />
          </a>
          <div>
            <IfFeature name="show_discord_bot_link">
              <FormattedMessage
                id="home.add-to-discord"
                defaultMessage="Add the <a>{appName} Bot</a> to Discord"
                values={{
                  a: chunks => (
                    <>
                      <img src={discordLogoUrl} />
                      <a href="/discord">{chunks}</a>
                    </>
                  ),
                  appName: configs.translation("app-name")
                }}
              />
            </IfFeature>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}

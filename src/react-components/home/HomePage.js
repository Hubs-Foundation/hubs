import React from "react";
import { FormattedMessage } from "react-intl";
import classNames from "classnames";
import Hubs from "@hubs/core";
import { Page, IfFeature, useStoreStateChange, useFavoriteRooms, usePublicRooms } from "@hubs/react";
import { PWAButton, CreateRoomButton, styles, discordLogoUrl, MediaGrid, RoomTile } from "@hubs/home-page";

export function HomePage() {
  const { store } = useStoreStateChange();

  const { results: favoriteRooms } = useFavoriteRooms();
  const { results: publicRooms } = usePublicRooms();

  const featuredRooms = Array.from(new Set([...favoriteRooms, ...publicRooms])).sort(
    (a, b) => b.member_count - a.member_count
  );

  const canCreateRooms = !Hubs.config.feature("disable_room_creation") || store.isAdmin();

  const pageStyle = { backgroundImage: Hubs.config.image("home_background", true) };

  const logoUrl = Hubs.config.image("logo");

  const showDescription = featuredRooms.length === 0;

  const logoStyles = classNames(styles.logoContainer, {
    [styles.centerLogo]: !showDescription
  });

  return (
    <Page className={styles.homePage} style={pageStyle}>
      <section>
        <div className={styles.appInfo}>
          <div className={logoStyles}>
            <img src={logoUrl} />
          </div>
          {showDescription && (
            <div className={styles.appDescription}>
              <FormattedMessage id="app-description" />
            </div>
          )}
        </div>
        <div className={styles.ctaButtons}>
          {canCreateRooms && <CreateRoomButton />}
          <PWAButton />
        </div>
      </section>
      {featuredRooms.length > 0 && (
        <section className={styles.featuredRooms}>
          <MediaGrid>{featuredRooms.map(room => <RoomTile key={room.id} room={room} />)}</MediaGrid>
        </section>
      )}
      <section>
        <div className={styles.secondaryLinks}>
          <a href="/link">
            <FormattedMessage id="home.have_code" />
          </a>
          <div>
            <IfFeature name="show_discord_bot_link">
              <FormattedMessage id="home.add_to_discord_1" />
              <img src={discordLogoUrl} />
              <a href="/discord">
                <FormattedMessage id="home.add_to_discord_2" />
              </a>
              <FormattedMessage id="home.add_to_discord_3" />
            </IfFeature>
          </div>
        </div>
      </section>
    </Page>
  );
}

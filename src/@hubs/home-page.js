import { HomePage as _HomePage } from "../react-components/home/HomePage";
import { CreateRoomButton as _CreateRoomButton } from "../react-components/home/CreateRoomButton";
import { PWAButton as _PWAButton } from "../react-components/home/PWAButton";
import { RoomTile as _RoomTile } from "../react-components/home/RoomTile";
import { MediaGrid as _MediaGrid } from "../react-components/home/MediaGrid";
import _styles from "../react-components/home/HomePage.scss";
import _discordLogoUrl from "../assets/images/discord-logo-small.png";

const homePage = {
  HomePage: _HomePage,
  CreateRoomButton: _CreateRoomButton,
  PWAButton: _PWAButton,
  RoomTile: _RoomTile,
  MediaGrid: _MediaGrid,
  styles: _styles,
  discordLogoUrl: _discordLogoUrl
};

if (window.Hubs) {
  window.Hubs.homePage = homePage;
} else {
  window.Hubs = { homePage };
}

export const HomePage = _HomePage;
export const CreateRoomButton = _CreateRoomButton;
export const PWAButton = _PWAButton;
export const RoomTile = _RoomTile;
export const MediaGrid = _MediaGrid;
export const styles = _styles;
export const discordLogoUrl = _discordLogoUrl;

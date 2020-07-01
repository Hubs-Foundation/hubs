import { CreateRoomButton as _CreateRoomButton } from "../react-components/home/CreateRoomButton";
import { PWAButton as _PWAButton } from "../react-components/home/PWAButton";
import _PageStyles from "../react-components/home/HomePage.scss";
import _discordLogoSmall from "../assets/images/discord-logo-small.png";

const homePage = {
  CreateRoomButton: _CreateRoomButton,
  PWAButton: _PWAButton,
  PageStyles: _PageStyles,
  discordLogoSmall: _discordLogoSmall
};

if (window.Hubs) {
  window.Hubs.homePage = homePage;
} else {
  window.Hubs = { homePage };
}

export const CreateRoomButton = _CreateRoomButton;
export const PWAButton = _PWAButton;
export const PageStyles = _PageStyles;
export const discordLogoSmall = _discordLogoSmall;

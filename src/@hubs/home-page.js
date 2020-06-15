import { CreateRoomButton as _CreateRoomButton } from "../react-components/input/CreateRoomButton";
import { PWAButton as _PWAButton } from "../react-components/input/PWAButton";
import _PageStyles from "../react-components/home/HomePage.scss";
import _discordLogoSmall from "../assets/images/discord-logo-small.png";
import { useHomePageRedirect as _useHomePageRedirect } from "../react-components/home/useHomePageRedirect";

const homePage = {
  CreateRoomButton: _CreateRoomButton,
  PWAButton: _PWAButton,
  PageStyles: _PageStyles,
  discordLogoSmall: _discordLogoSmall,
  useHomePageRedirect: _useHomePageRedirect
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
export const useHomePageRedirect = _useHomePageRedirect;

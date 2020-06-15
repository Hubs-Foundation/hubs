import { CreateRoomButton } from "../react-components/input/CreateRoomButton";
import { PWAButton } from "../react-components/input/PWAButton";
import PageStyles from "../react-components/home/HomePage.scss";
import discordLogoSmall from "../assets/images/discord-logo-small.png";
import { useHomePageRedirect } from "../react-components/home/useHomePageRedirect";

export default function init() {
  window.Hubs.homePage = {
    CreateRoomButton,
    PWAButton,
    PageStyles,
    discordLogoSmall,
    useHomePageRedirect
  };
}

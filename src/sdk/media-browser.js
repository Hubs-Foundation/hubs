import MediaTiles from "../react-components/media-tiles";
import styles from "../assets/stylesheets/media-browser.scss";

export default function init() {
  window.Hubs.mediaBrowser = {
    MediaTiles,
    styles
  };
}

import _MediaTiles from "../react-components/media-tiles";
import _styles from "../assets/stylesheets/media-browser.scss";

const mediaBrowser = {
  MediaTiles: _MediaTiles,
  styles: _styles
};

if (window.Hubs) {
  window.Hubs.mediaBrowser = mediaBrowser;
} else {
  window.Hubs = { mediaBrowser };
}

export const MediaTiles = _MediaTiles;
export const styles = _styles;

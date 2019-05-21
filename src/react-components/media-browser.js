import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import classNames from "classnames";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons/faCloudUploadAlt";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
import { faPencilAlt } from "@fortawesome/free-solid-svg-icons/faPencilAlt";
import { faPlus } from "@fortawesome/free-solid-svg-icons/faPlus";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "../assets/stylesheets/media-browser.scss";
import { scaledThumbnailUrlFor } from "../utils/media-utils";
import { pushHistoryPath, pushHistoryState, sluglessPath } from "../utils/history";
import { SOURCES } from "../storage/media-search-store";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import { showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import StateLink from "./state-link";

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();

const PUBLISHER_FOR_ENTRY_TYPE = {
  sketchfab_model: "Sketchfab",
  poly_model: "Google Poly",
  twitch_stream: "Twitch"
};

const PRIVACY_POLICY_LINKS = {
  videos: "https://privacy.microsoft.com/en-us/privacystatement",
  images: "https://privacy.microsoft.com/en-us/privacystatement",
  gifs: "https://tenor.com/legal-privacy",
  sketchfab: "https://sketchfab.com/privacy",
  poly: "https://policies.google.com/privacy",
  youtube: "https://policies.google.com/privacy",
  twitch: "https://www.twitch.tv/p/legal/privacy-policy/"
};

const DEFAULT_FACETS = {
  sketchfab: [
    { text: "Animals", params: { filter: "animals-pets" } },
    { text: "Architecture", params: { filter: "architecture" } },
    { text: "Art", params: { filter: "art-abstract" } },
    { text: "Vehicles", params: { filter: "cars-vehicles" } },
    { text: "Characters", params: { filter: "characters-creatures" } },
    { text: "Culture", params: { filter: "cultural-heritage-history" } },
    { text: "Gadgets", params: { filter: "electronics-gadgets" } },
    { text: "Fashion", params: { filter: "fashion-style" } },
    { text: "Food", params: { filter: "food-drink" } },
    { text: "Furniture", params: { filter: "furniture-home" } },
    { text: "Music", params: { filter: "music" } },
    { text: "Nature", params: { filter: "nature-plants" } },
    { text: "News", params: { filter: "news-politics" } },
    { text: "People", params: { filter: "people" } },
    { text: "Places", params: { filter: "places-travel" } },
    { text: "Science", params: { filter: "science-technology" } },
    { text: "Sports", params: { filter: "sports-fitness" } },
    { text: "Weapons", params: { filter: "weapons-military" } }
  ],
  poly: [
    { text: "Animals", params: { filter: "animals" } },
    { text: "Architecture", params: { filter: "architecture" } },
    { text: "Art", params: { filter: "art" } },
    { text: "Food", params: { filter: "food" } },
    { text: "Nature", params: { filter: "nature" } },
    { text: "Objects", params: { filter: "objects" } },
    { text: "People", params: { filter: "people" } },
    { text: "Scenes", params: { filter: "scenes" } },
    { text: "Transport", params: { filter: "transport" } }
  ],
  avatars: [
    { text: "Featured", params: { filter: "featured" } },
    { text: "My Avatars", params: { filter: "my-avatars" } }
  ],
  scenes: [{ text: "Featured", params: { filter: "featured" } }, { text: "My Scenes", params: { filter: "my-scenes" } }]
};

class MediaBrowser extends Component {
  static propTypes = {
    mediaSearchStore: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object,
    hubChannel: PropTypes.object,
    onMediaSearchResultEntrySelected: PropTypes.func,
    performConditionalSignIn: PropTypes.func
  };

  state = { query: "", facets: [], showNav: true, selectNextResult: false, clearStashedQueryOnClose: false };

  constructor(props) {
    super(props);
    this.state = this.getStoreAndHistoryState(props);
    this.props.mediaSearchStore.addEventListener("statechanged", this.storeUpdated);
    this.props.mediaSearchStore.addEventListener("sourcechanged", this.sourceChanged);
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.props.mediaSearchStore.removeEventListener("statechanged", this.storeUpdated);
    this.props.mediaSearchStore.removeEventListener("sourcechanged", this.sourceChanged);
  }

  storeUpdated = () => {
    const newState = this.getStoreAndHistoryState(this.props);
    this.setState(newState);

    if (this.state.selectNextResult) {
      if (newState.result && newState.result.entries.length > 0) {
        this.selectEntry(newState.result.entries[0]);
      } else {
        this.close();
      }
    }
  };

  sourceChanged = () => {
    if (this.inputRef && !isMobile && !isMobileVR) {
      this.inputRef.focus();
    }
  };

  getUrlSource = searchParams =>
    searchParams.get("media_source") || sluglessPath(this.props.history.location).substring(7);

  getStoreAndHistoryState = props => {
    const searchParams = new URLSearchParams(props.history.location.search);
    const result = props.mediaSearchStore.result;

    const newState = { result, query: this.state.query || searchParams.get("q") || "" };
    const urlSource = this.getUrlSource(searchParams);
    newState.showNav = !!(searchParams.get("media_nav") !== "false");

    if (result && result.suggestions && result.suggestions.length > 0) {
      newState.facets = result.suggestions.map(s => {
        return { text: s, params: { q: s } };
      });
    } else {
      newState.facets = DEFAULT_FACETS[urlSource] || [];
    }

    return newState;
  };

  handleQueryUpdated = (query, forceNow) => {
    this.setState({ result: null });

    if (this._sendQueryTimeout) {
      clearTimeout(this._sendQueryTimeout);
      this._sendQueryTimeout = null;
    }

    if (forceNow) {
      this.props.mediaSearchStore.filterQueryNavigate("", query);
    } else {
      // Don't update search on every keystroke, but buffer for some ms.
      this._sendQueryTimeout = setTimeout(() => {
        // Drop filter for now, so entering text drops into "search all" mode
        this.props.mediaSearchStore.filterQueryNavigate("", query);
        this._sendQueryTimeout = null;
      }, 500);
    }

    this.setState({ query });
  };

  handleEntryClicked = (evt, entry) => {
    evt.preventDefault();

    if (!entry.lucky_query) {
      this.selectEntry(entry);
    } else {
      // Entry has a pointer to another "i'm feeling lucky" query -- used for trending videos
      //
      // Also, mark the browser to clear the stashed query on close, since this is a temporary
      // query we are running to get the result we want.
      this.setState({ clearStashedQueryOnClose: true });
      this.handleQueryUpdated(entry.lucky_query, true);
    }
  };

  selectEntry = entry => {
    if (!this.props.onMediaSearchResultEntrySelected) return;
    this.props.onMediaSearchResultEntrySelected(entry);
    this.close();
  };

  handleSourceClicked = source => {
    this.props.mediaSearchStore.sourceNavigate(source);
  };

  handleFacetClicked = facet => {
    const searchParams = this.getSearchClearedSearchParams(true, true);

    for (const [k, v] of Object.entries(facet.params)) {
      searchParams.set(k, v);
    }

    pushHistoryPath(this.props.history, this.props.history.location.pathname, searchParams.toString());
  };

  getSearchClearedSearchParams = (keepSource, keepNav) => {
    return this.props.mediaSearchStore.getSearchClearedSearchParams(this.props.history.location, keepSource, keepNav);
  };

  pushExitMediaBrowserHistory = (stashLastSearchParams = true) => {
    this.props.mediaSearchStore.pushExitMediaBrowserHistory(this.props.history, stashLastSearchParams);
  };

  showCustomMediaDialog = source => {
    const isSceneApiType = source === "scene_listings" || source === "scenes";
    // Note: The apiSource for avatars *is* actually singular. We should probably fix this on the backend.
    const isAvatarApiType = source === "avatar_listings" || source === "avatar";
    this.pushExitMediaBrowserHistory(!isAvatarApiType);
    const dialog = isSceneApiType ? "change_scene" : isAvatarApiType ? "avatar_url" : "create";
    pushHistoryState(this.props.history, "modal", dialog);
  };

  close = () => {
    showFullScreenIfWasFullScreen();
    const urlSource = this.getUrlSource(new URLSearchParams(this.props.history.location.search));
    this.pushExitMediaBrowserHistory(urlSource !== "avatars");
    if (this.state.clearStashedQueryOnClose) {
      this.props.mediaSearchStore.clearStashedQuery();
    }
  };

  handlePager = delta => {
    this.setState({ result: null });
    this.props.mediaSearchStore.pageNavigate(delta);
    this.browserDiv.scrollTop = 0;
  };

  render() {
    const { formatMessage } = this.props.intl;
    const hasMeta = !!(this.state.result && this.state.result.meta);
    const hasNext = !!(hasMeta && this.state.result.meta.next_cursor) || false;
    const searchParams = new URLSearchParams(this.props.history.location.search);
    const hasPrevious = searchParams.get("cursor");
    const urlSource = this.getUrlSource(searchParams);
    const apiSource = (hasMeta && this.state.result.meta.source) || null;
    const isVariableWidth = this.state.result && ["bing_images", "tenor"].includes(apiSource);
    const isSceneApiType = apiSource === "scene_listings" || apiSource === "scenes";
    // Note: The apiSource for avatars *is* actually singular. We should probably fix this on the backend.
    const isAvatarApiType = apiSource === "avatar_listings" || apiSource === "avatar";
    const showCustomOption = !isSceneApiType || this.props.hubChannel.canOrWillIfCreator("update_hub");
    const [createTileWidth, createTileHeight] = this.getTileDimensions(false, urlSource === "avatars");
    const entries = (this.state.result && this.state.result.entries) || [];
    const hideSearch = urlSource === "avatars";

    // Don't render anything if we just did a feeling lucky query and are waiting on result.
    if (this.state.selectNextResult) return <div />;
    const handleCustomClicked = apiSource => {
      if (isAvatarApiType) {
        this.showCustomMediaDialog(apiSource);
      } else {
        this.props.performConditionalSignIn(
          () => !isSceneApiType || this.props.hubChannel.can("update_hub"),
          () => this.showCustomMediaDialog(apiSource),
          "change-scene"
        );
      }
    };

    return (
      <div className={styles.mediaBrowser} ref={browserDiv => (this.browserDiv = browserDiv)}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={classNames(styles.header, { [styles.noSearch]: hideSearch })}>
            <div className={styles.headerLeft}>
              <a onClick={() => this.close()}>
                <i>
                  <FontAwesomeIcon icon={faTimes} />
                </i>
              </a>
            </div>
            <div className={styles.headerCenter}>
              {!hideSearch && (
                <div className={styles.search}>
                  <i>
                    <FontAwesomeIcon icon={faSearch} />
                  </i>
                  <input
                    type="text"
                    autoFocus={!isMobile && !isMobileVR}
                    ref={r => (this.inputRef = r)}
                    placeholder={formatMessage({
                      id: `media-browser.search-placeholder.${urlSource}`
                    })}
                    onFocus={e => handleTextFieldFocus(e.target)}
                    onBlur={() => handleTextFieldBlur()}
                    onKeyDown={e => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        if (entries.length > 0 && !this._sendQueryTimeout) {
                          this.handleEntryClicked(e, entries[0]);
                        } else if (this.state.query.trim() !== "") {
                          this.handleQueryUpdated(this.state.query, true);
                          this.setState({ selectNextResult: true });
                        } else {
                          this.close();
                        }
                      } else if (e.key === "Escape" || (e.key === "Enter" && isMobile)) {
                        e.target.blur();
                      }
                    }}
                    value={this.state.query}
                    onChange={e => this.handleQueryUpdated(e.target.value)}
                  />
                </div>
              )}
              <div className={styles.engineAttribution}>
                {urlSource !== "scenes" && (
                  <div className={styles.engineAttributionContents}>
                    <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
                    {PRIVACY_POLICY_LINKS[urlSource] && (
                      <a href={PRIVACY_POLICY_LINKS[urlSource]} target="_blank" rel="noreferrer noopener">
                        <FormattedMessage id="media-browser.privacy_policy" />
                      </a>
                    )}
                  </div>
                )}
                {urlSource === "scenes" && (
                  <div className={styles.engineAttributionContents}>
                    <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
                    <a href="/spoke" target="_blank" rel="noreferrer noopener">
                      <FormattedMessage id="media-browser.spoke" />
                    </a>
                    |
                    <a target="_blank" rel="noopener noreferrer" href="/?report">
                      <FormattedMessage id="media-browser.report_issue" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.headerRight}>
              {showCustomOption && (
                <a onClick={() => handleCustomClicked(apiSource)} className={styles.createButton}>
                  <i>
                    <FontAwesomeIcon icon={["scenes", "avatars"].includes(urlSource) ? faLink : faCloudUploadAlt} />
                  </i>
                </a>
              )}
              {showCustomOption && (
                <a onClick={() => handleCustomClicked(apiSource)} className={styles.createLink}>
                  <FormattedMessage
                    id={`media-browser.add_custom_${
                      this.state.result && isSceneApiType ? "scene" : urlSource === "avatars" ? "avatar" : "object"
                    }`}
                  />
                </a>
              )}
            </div>
          </div>

          {this.state.showNav && (
            <div className={styles.nav}>
              {SOURCES.map(s => (
                <a
                  onClick={() => this.handleSourceClicked(s)}
                  key={s}
                  className={classNames({ [styles.navSource]: true, [styles.navSourceSelected]: urlSource === s })}
                >
                  <FormattedMessage id={`media-browser.nav_title.${s}`} />
                </a>
              ))}
              <div className={styles.navRightPad}>&nbsp;</div>
              <div className={styles.navScrollArrow}>
                <FontAwesomeIcon icon={faAngleRight} />
              </div>
            </div>
          )}

          {this.state.facets &&
            this.state.facets.length > 0 && (
              <div className={styles.facets}>
                {this.state.facets.map((s, i) => (
                  <a onClick={() => this.handleFacetClicked(s)} key={i} className={styles.facet}>
                    {s.text}
                  </a>
                ))}
              </div>
            )}

          <div className={styles.body}>
            <div className={classNames({ [styles.tiles]: true, [styles.tilesVariable]: isVariableWidth })}>
              {(urlSource === "avatars" || urlSource === "scenes") && (
                <div
                  style={{ width: `${createTileWidth}px`, height: `${createTileHeight}px` }}
                  className={classNames(styles.tile, styles.createTile)}
                >
                  {urlSource === "scenes" ? (
                    <a href="/spoke/new" rel="noopener noreferrer" target="_blank" className={styles.tileLink}>
                      <div className={styles.tileContent}>
                        <FontAwesomeIcon icon={faPlus} />
                        <FormattedMessage id="media-browser.create-scene" />
                      </div>
                    </a>
                  ) : (
                    <a
                      onClick={e => {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent("action_create_avatar"));
                      }}
                      className={styles.tileLink}
                    >
                      <div className={styles.tileContent}>
                        <FontAwesomeIcon icon={faPlus} />
                        <FormattedMessage id="media-browser.create-avatar" />
                      </div>
                    </a>
                  )}
                </div>
              )}

              {entries.map(this.entryToTile)}
            </div>

            {this.state.result &&
              (hasNext || hasPrevious) && (
                <div className={styles.pager}>
                  <a
                    className={classNames({ [styles.previousPage]: true, [styles.pagerButtonDisabled]: !hasPrevious })}
                    onClick={() => this.handlePager(-1)}
                  >
                    <FontAwesomeIcon icon={faAngleLeft} />
                  </a>
                  <div className={styles.pageNumber}>{this.state.result.meta.page}</div>
                  <a
                    className={classNames({ [styles.nextPage]: true, [styles.pagerButtonDisabled]: !hasNext })}
                    onClick={() => this.handlePager(1)}
                  >
                    <FontAwesomeIcon icon={faAngleRight} />
                  </a>
                </div>
              )}
          </div>
        </div>
      </div>
    );
  }

  getTileDimensions = (isImage, isAvatar, imageAspect) => {
    // Doing breakpointing here, so we can have proper image placeholder based upon dynamic aspect ratio
    const clientWidth = window.innerWidth;
    let imageHeight = clientWidth < 1079 ? (clientWidth < 768 ? (clientWidth < 400 ? 85 : 100) : 150) : 200;
    if (isAvatar) imageHeight = Math.floor(imageHeight * 1.5);

    // Aspect ratio can vary per image if its an image result. Avatars are a taller portrait aspect, o/w assume 720p
    let imageWidth;
    if (isImage) {
      imageWidth = Math.floor(Math.max(imageAspect * imageHeight, imageHeight * 0.85));
    } else if (isAvatar) {
      imageWidth = Math.floor((9 / 16) * imageHeight);
    } else {
      imageWidth = Math.floor(Math.max((16 / 9) * imageHeight, imageHeight * 0.85));
    }

    return [imageWidth, imageHeight];
  };

  entryToTile = (entry, idx) => {
    const imageSrc = entry.images.preview.url;
    const creator = entry.attributions && entry.attributions.creator;
    const isImage = entry.type.endsWith("_image");
    const isAvatar = ["avatar", "avatar_listing"].includes(entry.type);
    const imageAspect = entry.images.preview.width / entry.images.preview.height;

    const [imageWidth, imageHeight] = this.getTileDimensions(isImage, isAvatar, imageAspect);

    const publisherName =
      (entry.attributions && entry.attributions.publisher && entry.attributions.publisher.name) ||
      PUBLISHER_FOR_ENTRY_TYPE[entry.type];

    return (
      <div style={{ width: `${imageWidth}px` }} className={styles.tile} key={`${entry.id}_${idx}`}>
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer noopener"
          onClick={e => this.handleEntryClicked(e, entry)}
          className={styles.tileLink}
          style={{ width: `${imageWidth}px`, height: `${imageHeight}px` }}
        >
          <img
            className={classNames(styles.tileContent, styles.avatarTile)}
            src={scaledThumbnailUrlFor(imageSrc, imageWidth, imageHeight)}
          />
        </a>
        {entry.type === "avatar" && (
          <StateLink
            className={styles.editAvatar}
            stateKey="overlay"
            stateValue="avatar-editor"
            stateDetail={{ avatarId: entry.id }}
            history={this.props.history}
          >
            <FontAwesomeIcon icon={faPencilAlt} />
          </StateLink>
        )}
        {!entry.type.endsWith("_image") && (
          <div className={styles.info}>
            <a
              href={entry.url}
              target="_blank"
              rel="noreferrer noopener"
              className={styles.name}
              onClick={e => this.handleEntryClicked(e, entry)}
            >
              {entry.name || "\u00A0"}
            </a>
            {!isAvatar && (
              <div className={styles.attribution}>
                <div className={styles.creator}>
                  {creator && creator.name === undefined && <span>{creator}</span>}
                  {creator && creator.name && !creator.url && <span>{creator.name}</span>}
                  {creator &&
                    creator.name &&
                    creator.url && (
                      <a href={creator.url} target="_blank" rel="noopener noreferrer">
                        {creator.name}
                      </a>
                    )}
                </div>
                {publisherName && (
                  <div className={styles.publisher}>
                    <i>
                      <FontAwesomeIcon icon={faExternalLinkAlt} />
                    </i>
                    &nbsp;<a href={entry.url} target="_blank" rel="noopener noreferrer">
                      {publisherName}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
}

export default injectIntl(MediaBrowser);

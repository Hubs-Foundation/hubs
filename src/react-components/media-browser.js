import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import classNames from "classnames";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { faSearch } from "@fortawesome/free-solid-svg-icons/faSearch";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { faCloudUploadAlt } from "@fortawesome/free-solid-svg-icons/faCloudUploadAlt";
import { faLink } from "@fortawesome/free-solid-svg-icons/faLink";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import configs from "../utils/configs";
import IfFeature from "./if-feature";
import styles from "../assets/stylesheets/media-browser.scss";
import { pushHistoryPath, pushHistoryState, sluglessPath } from "../utils/history";
import { SOURCES } from "../storage/media-search-store";
import { handleTextFieldFocus, handleTextFieldBlur } from "../utils/focus-utils";
import { showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import MediaTiles from "./media-tiles";

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();

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
    { text: "Featured", params: { filter: "featured" } },
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
    { text: "Featured", params: { filter: "" } },
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
    { text: "My Avatars", params: { filter: "my-avatars" } },
    { text: "Newest", params: { filter: "" } }
  ],
  favorites: [],
  scenes: [{ text: "Featured", params: { filter: "featured" } }, { text: "My Scenes", params: { filter: "my-scenes" } }]
};

// TODO: Migrate to use MediaGrid and media specific components like RoomTile
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
    newState.selectAction = searchParams.get("selectAction") || "spawn";

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

  onCopyAvatar = () => {
    this.handleFacetClicked({ params: { filter: "my-avatars" } });
  };

  onCopyScene = () => {
    this.handleFacetClicked({ params: { filter: "my-scenes" } });
  };

  onShowSimilar = (id, name) => {
    this.handleFacetClicked({ params: { similar_to: id, similar_name: name } });
  };

  selectEntry = entry => {
    if (!this.props.onMediaSearchResultEntrySelected) return;
    this.props.onMediaSearchResultEntrySelected(entry, this.state.selectAction);
    this.close();
  };

  handleSourceClicked = source => {
    this.props.mediaSearchStore.sourceNavigate(source);
  };

  handleFacetClicked = facet => {
    this.setState({ query: "" }, () => {
      const searchParams = this.getSearchClearedSearchParams(true, true, true);

      for (const [k, v] of Object.entries(facet.params)) {
        searchParams.set(k, v);
      }

      pushHistoryPath(this.props.history, this.props.history.location.pathname, searchParams.toString());
    });
  };

  getSearchClearedSearchParams = (keepSource, keepNav, keepSelectAction) => {
    return this.props.mediaSearchStore.getSearchClearedSearchParams(
      this.props.history.location,
      keepSource,
      keepNav,
      keepSelectAction
    );
  };

  pushExitMediaBrowserHistory = (stashLastSearchParams = true) => {
    this.props.mediaSearchStore.pushExitMediaBrowserHistory(this.props.history, stashLastSearchParams);
  };

  showCustomMediaDialog = source => {
    const isSceneApiType = source === "scenes";
    const isAvatarApiType = source === "avatars";
    this.pushExitMediaBrowserHistory(!isAvatarApiType);
    const dialog = isSceneApiType ? "change_scene" : isAvatarApiType ? "avatar_url" : "create";
    pushHistoryState(this.props.history, "modal", dialog);
  };

  close = () => {
    showFullScreenIfWasFullScreen();
    const urlSource = this.getUrlSource(new URLSearchParams(this.props.history.location.search));
    this.pushExitMediaBrowserHistory(urlSource !== "avatars" && urlSource !== "favorites");
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
    const searchParams = new URLSearchParams(this.props.history.location.search);
    const urlSource = this.getUrlSource(searchParams);
    const isSceneApiType = urlSource === "scenes";
    const isFavorites = urlSource === "favorites";
    const showCustomOption =
      !isFavorites && (!isSceneApiType || this.props.hubChannel.canOrWillIfCreator("update_hub"));
    const entries = (this.state.result && this.state.result.entries) || [];
    const hideSearch = urlSource === "favorites";
    const showEmptyStringOnNoResult = urlSource !== "avatars" && urlSource !== "scenes";

    const facets = this.state.facets && this.state.facets.length > 0 && this.state.facets;

    // Don't render anything if we just did a feeling lucky query and are waiting on result.
    if (this.state.selectNextResult) return <div />;
    const handleCustomClicked = urlSource => {
      const isAvatarApiType = urlSource === "avatars";
      if (isAvatarApiType) {
        this.showCustomMediaDialog(urlSource);
      } else {
        this.props.performConditionalSignIn(
          () => !isSceneApiType || this.props.hubChannel.can("update_hub"),
          () => this.showCustomMediaDialog(urlSource),
          "change-scene"
        );
      }
    };

    const activeFilter =
      searchParams.get("filter") || (searchParams.get("similar_to") && "similar") || (!searchParams.get("q") && "");

    const meta = this.state.result && this.state.result.meta;
    const hasNext = !!(meta && meta.next_cursor);
    const hasPrevious = searchParams.get("cursor");
    const apiSource = (meta && meta.source) || null;
    const isVariableWidth = ["bing_images", "tenor"].includes(apiSource);

    return (
      <div className={styles.mediaBrowser} ref={browserDiv => (this.browserDiv = browserDiv)}>
        <div className={classNames([styles.box, styles.darkened])}>
          <div className={classNames(styles.header, { [styles.noSearch]: hideSearch })}>
            <div className={styles.headerLeft}>
              <button onClick={() => this.close()}>
                <i>
                  <FontAwesomeIcon icon={faTimes} />
                </i>
              </button>
            </div>
            <div className={styles.headerCenter}>
              {urlSource === "favorites" && (
                <div className={styles.favoritesHeader}>
                  <i>
                    <FontAwesomeIcon icon={faStar} />
                  </i>
                  <FormattedMessage id="media-browser.favorites-header" />
                </div>
              )}
              {!hideSearch && (
                <div className={styles.search}>
                  <i className={styles.searchIcon}>
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
                  <i className={styles.searchClear} onClick={() => this.handleQueryUpdated("", true)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </i>
                </div>
              )}
              <div className={styles.engineAttribution}>
                {!hideSearch &&
                  urlSource !== "scenes" &&
                  urlSource !== "avatars" &&
                  urlSource !== "favorites" && (
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
                    <IfFeature name="enable_spoke">
                      <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
                      <a href="/spoke" target="_blank" rel="noreferrer noopener">
                        <FormattedMessage id="editor-name" />
                      </a>
                    </IfFeature>
                    {configs.feature("enable_spoke") && configs.feature("show_issue_report_link") && "|"}
                    <IfFeature name="show_issue_report_link">
                      <a
                        target="_blank"
                        rel="noopener noreferrer"
                        href={configs.link("issue_report", "https://hubs.mozilla.com/docs/help.html")}
                      >
                        <FormattedMessage id="media-browser.report_issue" />
                      </a>
                    </IfFeature>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.headerRight}>
              {showCustomOption && (
                <a onClick={() => handleCustomClicked(urlSource)} className={styles.createButton}>
                  <i>
                    <FontAwesomeIcon icon={["scenes", "avatars"].includes(urlSource) ? faLink : faCloudUploadAlt} />
                  </i>
                </a>
              )}
              {showCustomOption && (
                <a onClick={() => handleCustomClicked(urlSource)} className={styles.createLink}>
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

          {(facets || activeFilter === "similar") && (
            <div className={styles.facets}>
              {facets &&
                facets.map((s, i) => (
                  <a
                    onClick={() => this.handleFacetClicked(s)}
                    key={i}
                    className={classNames(styles.facet, { selected: s.params.filter === activeFilter })}
                  >
                    {s.text}
                  </a>
                ))}
              {activeFilter === "similar" && (
                <a className={classNames(styles.facet, "selected")}>
                  <FormattedMessage
                    id="media-browser.similar-to-facet"
                    values={{ name: searchParams.get("similar_name") }}
                  />
                </a>
              )}
            </div>
          )}

          {this.props.mediaSearchStore.isFetching ||
          this._sendQueryTimeout ||
          entries.length > 0 ||
          !showEmptyStringOnNoResult ? (
            <MediaTiles
              entries={entries}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              isVariableWidth={isVariableWidth}
              history={this.props.history}
              urlSource={urlSource}
              handleEntryClicked={this.handleEntryClicked}
              onCopyAvatar={this.onCopyAvatar}
              onCopyScene={this.onCopyScene}
              onShowSimilar={this.onShowSimilar}
              handlePager={this.handlePager}
            />
          ) : (
            <div className={styles.emptyString}>
              <FormattedMessage id={`media-browser.empty.${urlSource}`} />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default injectIntl(MediaBrowser);

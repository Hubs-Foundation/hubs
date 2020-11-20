import React, { Component } from "react";
import PropTypes from "prop-types";
import { injectIntl, FormattedMessage } from "react-intl";
import configs from "../utils/configs";
import { pushHistoryPath, pushHistoryState, sluglessPath } from "../utils/history";
import { SOURCES } from "../storage/media-search-store";
import { showFullScreenIfWasFullScreen } from "../utils/fullscreen";
import { AvatarUrlModalContainer } from "./room/AvatarUrlModalContainer";
import { SceneUrlModalContainer } from "./room/SceneUrlModalContainer";
import { ObjectUrlModalContainer } from "./room/ObjectUrlModalContainer";
import { MediaBrowser } from "./room/MediaBrowser";
import { IconButton } from "./input/IconButton";
import { ReactComponent as UploadIcon } from "./icons/Upload.svg";
import { ReactComponent as LinkIcon } from "./icons/Link.svg";
import { remixAvatar } from "../utils/avatar-utils";
import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "../utils/phoenix-utils";
import { proxiedUrlFor, scaledThumbnailUrlFor } from "../utils/media-url-utils";
import { CreateTile, MediaTile } from "./room/MediaTiles";
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
class MediaBrowserContainer extends Component {
  static propTypes = {
    mediaSearchStore: PropTypes.object,
    history: PropTypes.object,
    intl: PropTypes.object,
    hubChannel: PropTypes.object,
    onMediaSearchResultEntrySelected: PropTypes.func,
    performConditionalSignIn: PropTypes.func,
    showNonHistoriedDialog: PropTypes.func.isRequired,
    scene: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
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
    const { scene, store, hubChannel } = this.props;
    const isAvatarApiType = source === "avatars";
    this.pushExitMediaBrowserHistory(!isAvatarApiType);

    if (source === "scenes") {
      this.props.showNonHistoriedDialog(SceneUrlModalContainer, { hubChannel });
    } else if (isAvatarApiType) {
      this.props.showNonHistoriedDialog(AvatarUrlModalContainer, { scene, store });
    } else {
      this.props.showNonHistoriedDialog(ObjectUrlModalContainer, { scene });
    }
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

  handleCopyAvatar = async (e, entry) => {
    e.preventDefault();
    await remixAvatar(entry.id, entry.name);
    this.onCopyAvatar();
  };

  handleCopyScene = async (e, entry) => {
    e.preventDefault();
    await fetchReticulumAuthenticated("/api/v1/scenes", "POST", {
      parent_scene_id: entry.id
    });
    this.onCopyScene();
  };

  onCreateAvatar = () => {
    window.dispatchEvent(new CustomEvent("action_create_avatar"));
  };

  processThumbnailUrl = (entry, thumbnailWidth, thumbnailHeight) => {
    if (entry.images.preview.type === "mp4") {
      return proxiedUrlFor(entry.images.preview.url);
    } else {
      return scaledThumbnailUrlFor(entry.images.preview.url, thumbnailWidth, thumbnailHeight);
    }
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

    const facets = this.state.facets && this.state.facets.length > 0 ? this.state.facets : undefined;

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
    const hasPrevious = !!searchParams.get("cursor");
    const apiSource = (meta && meta.source) || null;
    const isVariableWidth = ["bing_images", "tenor"].includes(apiSource);

    let searchDescription;

    if (!hideSearch && urlSource !== "scenes" && urlSource !== "avatars" && urlSource !== "favorites") {
      searchDescription = (
        <>
          <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
          {PRIVACY_POLICY_LINKS[urlSource] && (
            <a href={PRIVACY_POLICY_LINKS[urlSource]} target="_blank" rel="noreferrer noopener">
              <FormattedMessage id="media-browser.privacy_policy" />
            </a>
          )}
        </>
      );
    } else if (urlSource === "scenes") {
      searchDescription = (
        <>
          {configs.feature("enable_spoke") && (
            <>
              <FormattedMessage id={`media-browser.powered_by.${urlSource}`} />
              <a href="/spoke" target="_blank" rel="noreferrer noopener">
                <FormattedMessage id="editor-name" />
              </a>
            </>
          )}
          {configs.feature("enable_spoke") && configs.feature("show_issue_report_link") && " | "}
          {configs.feature("show_issue_report_link") && (
            <a
              target="_blank"
              rel="noopener noreferrer"
              href={configs.link("issue_report", "https://hubs.mozilla.com/docs/help.html")}
            >
              <FormattedMessage id="media-browser.report_issue" />
            </a>
          )}
        </>
      );
    }

    return (
      <MediaBrowser
        browserRef={r => (this.browserDiv = r)}
        onClose={this.close}
        searchInputRef={r => (this.inputRef = r)}
        autoFocusSearch={!isMobile && !isMobileVR}
        query={this.state.query}
        onChangeQuery={e => this.handleQueryUpdated(e.target.value)}
        onSearchKeyDown={e => {
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
        onClearSearch={() => this.handleQueryUpdated("", true)}
        mediaSources={urlSource === "favorites" ? undefined : SOURCES}
        selectedSource={urlSource}
        onSelectSource={this.handleSourceClicked}
        activeFilter={activeFilter}
        facets={facets}
        onSelectFacet={this.handleFacetClicked}
        searchPlaceholder={formatMessage({
          id: `media-browser.search-placeholder.${urlSource}`
        })}
        searchDescription={searchDescription}
        headerRight={
          showCustomOption && (
            <IconButton lg onClick={() => handleCustomClicked(urlSource)}>
              {["scenes", "avatars"].includes(urlSource) ? <LinkIcon /> : <UploadIcon />}
              <p>
                <FormattedMessage
                  id={`media-browser.add_custom_${
                    this.state.result && isSceneApiType ? "scene" : urlSource === "avatars" ? "avatar" : "object"
                  }`}
                />
              </p>
            </IconButton>
          )
        }
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        onNextPage={() => this.handlePager(1)}
        onPreviousPage={() => this.handlePager(-1)}
        isVariableWidth={isVariableWidth}
      >
        {this.props.mediaSearchStore.isFetching ||
        this._sendQueryTimeout ||
        entries.length > 0 ||
        !showEmptyStringOnNoResult ? (
          <>
            {urlSource === "avatars" && (
              <CreateTile
                type="avatar"
                onClick={this.onCreateAvatar}
                label={<FormattedMessage id="media-browser.create-avatar" />}
              />
            )}
            {urlSource === "scenes" &&
              configs.feature("enable_spoke") && (
                <CreateTile
                  as="a"
                  href="/spoke/new"
                  rel="noopener noreferrer"
                  target="_blank"
                  type="scene"
                  label={<FormattedMessage id="media-browser.create-scene" />}
                />
              )}
            {entries.map((entry, idx) => {
              const isAvatar = entry.type === "avatar" || entry.type === "avatar_listing";
              const isScene = entry.type === "scene" || entry.type === "scene_listing";
              const onShowSimilar =
                entry.type === "avatar_listing"
                  ? e => {
                      e.preventDefault();
                      this.onShowSimilar(entry.id, entry.name);
                    }
                  : undefined;

              let onEdit;

              if (entry.type === "avatar") {
                onEdit = e => {
                  e.preventDefault();
                  pushHistoryState(this.props.history, "overlay", "avatar-editor", { avatarId: entry.id });
                };
              } else if (entry.type === "scene") {
                onEdit = e => {
                  e.preventDefault();
                  const spokeProjectUrl = getReticulumFetchUrl(`/spoke/projects/${entry.project_id}`);
                  window.open(spokeProjectUrl);
                };
              }

              let onCopy;

              if (isAvatar) {
                onCopy = e => this.handleCopyAvatar(e, entry);
              } else if (isScene) {
                onCopy = e => this.handleCopyScene(e, entry);
              }

              return (
                <MediaTile
                  key={`${entry.id}_${idx}`}
                  entry={entry}
                  processThumbnailUrl={this.processThumbnailUrl}
                  onClick={e => this.handleEntryClicked(e, entry)}
                  onEdit={onEdit}
                  onShowSimilar={onShowSimilar}
                  onCopy={onCopy}
                />
              );
            })}
          </>
        ) : (
          <FormattedMessage id={`media-browser.empty.${urlSource}`} />
        )}
      </MediaBrowser>
    );
  }
}

export default injectIntl(MediaBrowserContainer);

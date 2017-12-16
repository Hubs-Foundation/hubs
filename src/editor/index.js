import styles from "./editor.css";

import React, { Component } from "react";
import InfiniteScroll from "react-infinite-scroller";

function Asset({ asset, onSelect }) {
  return (
    <div className={styles.asset} onClick={() => onSelect(asset)}>
      <img src={asset.thumbnail.url} />
      <div className="detail">
        <h3>{asset.displayName}</h3>
        <p>{asset.authorName}</p>
      </div>
    </div>
  );
}

class AssetsList extends Component {
  constructor() {
    super();

    this.state = {
      keywords: "",
      assets: [],
      nextPageToken: null,
      hasMore: true
    };

    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.loadAssets = this.loadAssets.bind(this);
  }

  onChangeSearch(e) {
    if (this.abortController) {
      this.abortController.abort();
    }

    this.setState({
      keywords: e.target.value,
      assets: [],
      nextPageToken: null,
      hasMore: true
    });
  }

  async loadAssets() {
    const curPageToken = this.state.nextPageToken
      ? "&pageToken=" + this.state.nextPageToken
      : "";

    const originalKeywords = this.state.keywords;
    const keywords = originalKeywords ? "&keywords=" + originalKeywords : "";

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      const res = await fetch(
        `https://poly.googleapis.com/v1/assets?key=${
          CONFIG.polyAPIKey
        }&format=GLTF2${curPageToken}${keywords}`,
        { signal }
      );

      const json = await res.json();

      if (!json.assets || this.state.keywords !== originalKeywords) {
        this.setState({
          assets: [],
          nextPageToken: null,
          hasMore: false
        });
        return;
      }

      const { assets, nextPageToken } = json;
      const nextAssets = this.state.assets.concat(assets);

      this.setState({
        assets: nextAssets,
        nextPageToken,
        hasMore: !!nextPageToken
      });
    } catch (err) {
      this.setState({
        assets: [],
        nextPageToken: null,
        hasMore: true
      });
    } finally {
      this.abortController = null;
    }
  }

  render() {
    const { onSelect } = this.props;
    const { keywords, assets, nextPageToken, hasMore } = this.state;

    const loader = <div>loading...</div>;

    return (
      <div className={styles.assets}>
        <h2>Assets</h2>
        <input
          placeholder="Search for things"
          className={styles.search}
          type="text"
          value={keywords}
          onChange={this.onChangeSearch}
        />
        <div className={styles.assetsList}>
          <InfiniteScroll
            loader={loader}
            hasMore={hasMore}
            loadMore={this.loadAssets}
            useWindow={false}
          >
            {assets.map(asset => (
              <Asset key={asset.name} asset={asset} onSelect={onSelect} />
            ))}
          </InfiniteScroll>
        </div>
      </div>
    );
  }
}

export default function Editor({ onSelectAsset }) {
  return <AssetsList onSelect={onSelectAsset} />;
}

import { World } from "./World";
import { TextureCache } from "./caches/TextureCache";
import { resolveUrl } from "../utils/media-utils";
import { proxiedUrlFor, guessContentType } from "../utils/media-url-utils";
import { InteractableComponent, NetworkedComponent } from "./components";
import { InteractableSystem } from "./systems/InteractableSystem";
import { NetworkingSystem } from "./systems/NetworkingSystem";

const fetchContentType = url => {
  return fetch(url, { method: "HEAD" }).then(r => r.headers.get("content-type"));
};

export class HubsWorld extends World {
  constructor() {
    super();

    this.textureCache = new TextureCache();
    this.registerComponent(InteractableComponent);
    this.registerComponent(NetworkedComponent);
    this.registerSystem(InteractableSystem);
    this.registerSystem(NetworkingSystem);
  }

  async resolveMedia(src, options = {}) {
    const result = await resolveUrl(src, options.quality, options.version, options.forceLocalRefresh);
    let canonicalUrl = result.origin;

    // handle protocol relative urls
    if (canonicalUrl.startsWith("//")) {
      canonicalUrl = location.protocol + canonicalUrl;
    }

    let canonicalAudioUrl = result.origin_audio;
    if (canonicalAudioUrl && canonicalAudioUrl.startsWith("//")) {
      canonicalAudioUrl = location.protocol + canonicalAudioUrl;
    }

    let contentType = (result.meta && result.meta.expected_content_type) || options.contentType;
    const thumbnail = result.meta && result.meta.thumbnail && proxiedUrlFor(result.meta.thumbnail);

    // todo: we don't need to proxy for many things if the canonical URL has permissive CORS headers
    const accessibleUrl = proxiedUrlFor(canonicalUrl);

    // if the component creator didn't know the content type, we didn't get it from reticulum, and
    // we don't think we can infer it from the extension, we need to make a HEAD request to find it out
    contentType = contentType || guessContentType(canonicalUrl) || (await fetchContentType(accessibleUrl));

    return { canonicalUrl, accessibleUrl, contentType, thumbnail };
  }

  update(dt, time) {
    const systems = this.systems;

    for (let i = 0; i < systems.length; i++) {
      systems[i].update(dt, time);
    }
  }
}

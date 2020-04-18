import { System } from "ecsy";
import { Object3D } from "ecsy-three";
import { MediaLoader } from "../components/MediaLoader";
import { resolveUrl } from "../../utils/media-utils";
import { proxiedUrlFor, guessContentType, fetchContentType } from "../../utils/media-url-utils";
import { Image } from "../components/Image";
import { Loading } from "../components/Loading";
import { Group } from "three";

export class MediaLoaderSystem extends System {
  static queries = {
    loaders: {
      components: [MediaLoader],
      listen: {
        added: true,
        removed: true,
        changed: true
      }
    }
  };

  execute() {
    const added = this.queries.loaders.added;

    for (let i = 0; i < added.length; i++) {
      this.addMedia(added[i]);
    }

    const changed = this.queries.loaders.changed;

    for (let i = 0; i < changed.length; i++) {
      this.updateMedia(changed[i]);
    }

    const removed = this.queries.loaders.removed;

    for (let i = 0; i < removed.length; i++) {
      this.removeMedia(removed[i]);
    }
  }

  async addMedia(entity) {
    const loader = entity.getComponent(MediaLoader);

    if (!entity.hasComponent(Object3D)) {
      entity.addComponent(Object3D, { value: new Group() });
    }

    entity.addComponent(Loading);

    const { accessibleUrl, contentType } = await this.resolveMedia(loader.src, { contentType: loader.contentType });

    if (contentType.startsWith("image/")) {
      entity.addComponent(Image, { src: accessibleUrl, contentType });
    } else {
      entity.removeComponent(Loading);
    }
  }

  updateMedia(entity) {
    this.removeMedia(entity);
    this.addMedia(entity);
  }

  removeMedia(entity) {
    entity.removeComponent(Image);
    entity.removeComponent(Loading);
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
}


  async createVideoTextureAudioSourceEl() {
    const url = this.data.src;
    const contentType = this.data.contentType;
    let pollTimeout;

    return new Promise(async (resolve, reject) => {
      if (this._audioSyncInterval) {
        clearInterval(this._audioSyncInterval);
        this._audioSyncInterval = null;
      }

      let resolved = false;
      const failLoad = function(e) {
        if (resolved) return;
        resolved = true;
        clearTimeout(pollTimeout);
        reject(e);
      };

      const videoEl = createVideoOrAudioEl("video");

      let texture, audioEl, isReady;
      if (contentType.startsWith("audio/")) {
        // We want to treat audio almost exactly like video, so we mock a video texture with an image property.
        texture = new THREE.Texture();
        texture.image = videoEl;
        isReady = () => videoEl.readyState > 0;
      } else {
        texture = new THREE.VideoTexture(videoEl);
        texture.minFilter = THREE.LinearFilter;
        texture.encoding = THREE.sRGBEncoding;

        // Firefox seems to have video play (or decode) performance issue.
        // Somehow setting RGBA format improves the performance very well.
        // Some tickets have been opened for the performance issue but
        // I don't think it will be fixed soon. So we set RGBA format for Firefox
        // as workaround so far.
        // See https://github.com/mozilla/hubs/issues/3470
        if (/firefox/i.test(navigator.userAgent)) {
          texture.format = THREE.RGBAFormat;
        }

        isReady = () => {
          if (texture.hls && texture.hls.streamController.audioOnly) {
            audioEl = videoEl;
            const hls = texture.hls;
            texture = new THREE.Texture();
            texture.image = videoEl;
            texture.hls = hls;
            return true;
          } else {
            const ready =
              (texture.image.videoHeight || texture.image.height) && (texture.image.videoWidth || texture.image.width);
            return ready;
          }
        };
      }

      // Set src on video to begin loading.
      if (url.startsWith("hubs://")) {
        const streamClientId = url.substring(7).split("/")[1]; // /clients/<client id>/video is only URL for now
        const stream = await APP.dialog.getMediaStream(streamClientId, "video");
        // We subscribe to video stream notifications for this peer to update the video element
        // This could happen in case there is an ICE failure that requires a transport recreation.
        if (this._onStreamUpdated) {
          APP.dialog.off("stream_updated", this._onStreamUpdated);
        }
        this._onStreamUpdated = async (peerId, kind) => {
          if (peerId === streamClientId && kind === "video") {
            // The video stream for this peer has been updated
            const stream = await APP.dialog.getMediaStream(peerId, "video").catch(e => {
              console.error(`Error getting video stream for ${peerId}`, e);
            });
            if (stream) {
              videoEl.srcObject = new MediaStream(stream);
            }
          }
        };
        APP.dialog.on("stream_updated", this._onStreamUpdated, this);
        videoEl.srcObject = new MediaStream(stream.getVideoTracks());
        // If hls.js is supported we always use it as it gives us better events
      } else if (contentType.startsWith("application/dash")) {
        const dashPlayer = MediaPlayer().create();
        dashPlayer.extend("RequestModifier", function() {
          return { modifyRequestHeader: xhr => xhr, modifyRequestURL: proxiedUrlFor };
        });
        dashPlayer.on(MediaPlayer.events.ERROR, failLoad);
        dashPlayer.initialize(videoEl, url);
        dashPlayer.setTextDefaultEnabled(false);

        // TODO this countinously pings to get updated time, unclear if this is actually needed, but this preserves the default behavior
        dashPlayer.clearDefaultUTCTimingSources();
        dashPlayer.addUTCTimingSource(
          "urn:mpeg:dash:utc:http-xsdate:2014",
          proxiedUrlFor("https://time.akamai.com/?iso")
        );
        // We can also use our own HEAD request method like we use to sync NAF
        // dashPlayer.addUTCTimingSource("urn:mpeg:dash:utc:http-head:2014", location.href);

        texture.dash = dashPlayer;
      } else if (AFRAME.utils.material.isHLS(url, contentType)) {
        if (HLS.isSupported()) {
          const corsProxyPrefix = `https://${configs.CORS_PROXY_SERVER}/`;
          const baseUrl = url.startsWith(corsProxyPrefix) ? url.substring(corsProxyPrefix.length) : url;
          const setupHls = () => {
            if (texture.hls) {
              texture.hls.stopLoad();
              texture.hls.detachMedia();
              texture.hls.destroy();
              texture.hls = null;
            }

            const hls = new HLS({
              debug: qsTruthy("hlsDebug"),
              xhrSetup: (xhr, u) => {
                if (u.startsWith(corsProxyPrefix)) {
                  u = u.substring(corsProxyPrefix.length);
                }

                // HACK HLS.js resolves relative urls internally, but our CORS proxying screws it up. Resolve relative to the original unproxied url.
                // TODO extend HLS.js to allow overriding of its internal resolving instead
                if (!u.startsWith("http")) {
                  u = buildAbsoluteURL(baseUrl, u.startsWith("/") ? u : `/${u}`);
                }

                xhr.open("GET", proxiedUrlFor(u), true);
              }
            });

            texture.hls = hls;
            hls.loadSource(url);
            hls.attachMedia(videoEl);

            hls.on(HLS.Events.ERROR, function(event, data) {
              if (data.fatal) {
                switch (data.type) {
                  case HLS.ErrorTypes.NETWORK_ERROR:
                    // try to recover network error
                    hls.startLoad();
                    break;
                  case HLS.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    failLoad(event);
                    return;
                }
              }
            });
          };

          setupHls();
        } else if (videoEl.canPlayType(contentType)) {
          videoEl.src = url;
          videoEl.onerror = failLoad;
        } else {
          failLoad("HLS unsupported");
        }
      } else {
        videoEl.src = url;

        // Workaround for Safari.
        // Safari seems to have a bug that it doesn't transfer range property in HTTP request header
        // for redirects if crossOrigin is set (while other major browsers do).
        // So Safari can fail to load video if the server responds redirect because
        // it expects 206 HTTP status code but gets 200.
        // If we fail to load video on Safari we retry with fetch() and videoEl.srcObject
        // which may avoid the problem.
        // Refer to #4516 for the details.
        if (isSafari()) {
          // There seems no way to detect whether the error is caused by the problem mentioned above.
          // So always retrying.
          videoEl.onerror = async () => {
            videoEl.onerror = failLoad;
            try {
              const res = await fetch(url);
              videoEl.srcObject = await res.blob();
            } catch (e) {
              failLoad(e);
            }
          };
        } else {
          videoEl.onerror = failLoad;
        }

        // audioSrc is non-empty only if audio track is separated from video track (eg. 360 video)
        if (this.data.audioSrc) {
          // Mute video track just in case
          videoEl.muted = true;

          // If there's an audio src, create an audio element to play it that we keep in sync
          // with the video while this component is active.
          audioEl = createVideoOrAudioEl("audio");
          audioEl.src = this.data.audioSrc;
          audioEl.onerror = failLoad;

          this._audioSyncInterval = setInterval(() => {
            if (Math.abs(audioEl.currentTime - videoEl.currentTime) >= 0.33) {
              // In Chrome, drift of a few frames seems persistent
              audioEl.currentTime = videoEl.currentTime;
            }

            // During pause state change, correct any drift that remains.
            if (videoEl.paused !== audioEl.paused) {
              videoEl.paused ? audioEl.pause() : audioEl.play();
              audioEl.currentTime = videoEl.currentTime;
            }
          }, 1000);
        }
      }

      // NOTE: We used to use the canplay event here to yield the texture, but that fails to fire on iOS Safari
      // and also sometimes in Chrome it seems.
      const poll = () => {
        if (isReady()) {
          resolved = true;
          resolve({ texture, audioSourceEl: audioEl || texture.image });
        } else {
          pollTimeout = setTimeout(poll, 500);
        }
      };

      poll();
    });
  },

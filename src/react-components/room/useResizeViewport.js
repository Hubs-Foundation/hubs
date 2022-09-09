import { useState, useEffect } from "react";
// ResizeObserver not currently supported in Firefox Android
import ResizeObserver from "resize-observer-polyfill";
import {
  addOrientationChangeListener,
  removeOrientationChangeListener,
  getMaxResolutionWidth,
  getMaxResolutionHeight
} from "../../utils/screen-orientation-utils";

function calculateRendererSize(canvasRect, maxResolution, isVR) {
  if (isVR) {
    return canvasRect;
  }

  // canvasRect values are CSS pixels based while
  // maxResolution values are physical pixels based (CSS pixels * pixel ratio).
  // Convert maxResolution values to CSS pixels based.
  const pixelRatio = window.devicePixelRatio;
  const maxWidth = maxResolution.width / pixelRatio;
  const maxHeight = maxResolution.height / pixelRatio;

  if (canvasRect.width <= maxWidth && canvasRect.height <= maxHeight) {
    return canvasRect;
  }

  const conversionRatio = Math.min(maxWidth / canvasRect.width, maxHeight / canvasRect.height);

  return {
    width: Math.round(canvasRect.width * conversionRatio),
    height: Math.round(canvasRect.height * conversionRatio)
  };
}

export function useResizeViewport(viewportRef, store, scene) {
  const [maxResolution, setMaxResolution] = useState({
    width: getMaxResolutionWidth(store),
    height: getMaxResolutionHeight(store)
  });

  useEffect(() => {
    function onStoreChanged() {
      setMaxResolution({
        width: getMaxResolutionWidth(store),
        height: getMaxResolutionHeight(store)
      });
    }

    onStoreChanged();

    store.addEventListener("statechanged", onStoreChanged);

    return () => {
      store.removeEventListener("statechanged", onStoreChanged);
    };
  }, [store]);

  useEffect(() => {
    return;
    const observer = new ResizeObserver(entries => {
      const isPresenting = scene.renderer.xr.isPresenting;
      const isVRPresenting = scene.renderer.xr.enabled && isPresenting;

      // Do not update renderer, if a camera or a canvas have not been injected.
      // In VR mode, three handles canvas resize based on the dimensions returned by
      // the getEyeParameters function of the WebVR API. These dimensions are independent of
      // the window size, therefore should not be overwritten with the window's width and
      // height, // except when in fullscreen mode.
      if (!scene.camera || !scene.canvas || (scene.is("vr-mode") && (scene.isMobile || isVRPresenting))) {
        return;
      }

      const canvasRect = entries[0].contentRect;

      const rendererSize = calculateRendererSize(canvasRect, maxResolution, isVRPresenting);

      const canvas = scene.canvas;
      canvas.style.width = canvasRect.width + "px";
      canvas.style.height = canvasRect.height + "px";

      // scene.renderer.setSize(rendererSize.width, rendererSize.height, false);

      scene.camera.aspect = rendererSize.width / rendererSize.height;
      scene.camera.updateProjectionMatrix();

      // Resizing the canvas clears it, so render immediately after resize to prevent flicker.
      // scene.renderer.render(scene.object3D, scene.camera);

      scene.emit("rendererresize", rendererSize, false);
    });

    observer.observe(viewportRef.current);

    return () => {
      observer.disconnect();
    };
  }, [viewportRef, scene, maxResolution]);

  useEffect(() => {
    function onOrientationChange() {
      setMaxResolution({
        width: getMaxResolutionWidth(store),
        height: getMaxResolutionHeight(store)
      });
    }

    addOrientationChangeListener(onOrientationChange);

    return () => {
      removeOrientationChangeListener(onOrientationChange);
    };
  }, [store]);
}

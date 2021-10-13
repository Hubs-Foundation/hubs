import { useEffect, useReducer, useRef, useCallback } from "react";
import { useIntl, defineMessages } from "react-intl";

function reducer(state, action) {
  switch (action.type) {
    case "object-loading":
      return { ...state, objectCount: state.objectCount + 1, messageKey: "loadingObjects" };
    case "object-loaded":
      return { ...state, loadedCount: state.loadedCount + 1 };
    case "all-objects-loaded":
      return {
        ...state,
        allObjectsLoaded: true,
        loading: !(state.environmentLoaded && state.networkConnected),
        messageKey: state.environmentLoaded ? "enteringRoom" : "loadingObjects"
      };
    case "environment-loaded": {
      const loaded = state.lazyLoadMedia
        ? state.networkConnected && state.dialogConnected
        : state.allObjectsLoaded && state.networkConnected && state.dialogConnected;
      return {
        ...state,
        environmentLoaded: true,
        loading: !loaded,
        messageKey: state.lazyLoadMedia
          ? loaded
            ? "enteringRoom"
            : "connectingScene"
          : loaded
            ? "enteringRoom"
            : "loadingObjects"
      };
    }
    case "network-connected":
      return {
        ...state,
        networkConnected: true,
        loading: state.lazyLoadMedia
          ? !(state.environmentLoaded && state.dialogConnected)
          : !(state.environmentLoaded && state.allObjectsLoaded && state.dialogConnected)
      };
    case "dialog-connected":
      return {
        ...state,
        dialogConnected: true,
        loading: state.lazyLoadMedia
          ? !(state.environmentLoaded && state.networkConnected)
          : !(state.environmentLoaded && state.allObjectsLoaded && state.networkConnected)
      };
  }
}

// defineMessages informs babel-plugin-react-intl what i18n data can be stripped/embedded when bundling.
const messages = defineMessages({
  default: {
    id: "loading-screen.default",
    description: "The scene has started loading.",
    defaultMessage: "Loading scene..."
  },
  loadingObjects: {
    id: "loading-screen.loading-objects",
    description: "The loading progress. How many objects have finished loading?",
    defaultMessage: "Loading objects {loadedCount}/{objectCount}"
  },
  connectingScene: {
    id: "loading-screen.connecting",
    description: "The scene is loaded, we are waiting for the networked scene to be connected to enter.",
    defaultMessage: "Connecting to the scene..."
  },
  enteringRoom: {
    id: "loading-screen.entering-room",
    description:
      "Once the scene has finished loading, this message tells uses that they will be entering the room shortly.",
    defaultMessage: "Entering room..."
  }
});

export function useRoomLoadingState(sceneEl) {
  // Holds the id of the current
  const loadingTimeoutRef = useRef();
  const lazyLoadMedia = APP.store.state.preferences.lazyLoadSceneMedia;

  const [{ loading, messageKey, objectCount, loadedCount }, dispatch] = useReducer(reducer, {
    loading: !sceneEl.is("loaded"),
    messageKey: "default",
    objectCount: 0,
    loadedCount: 0,
    allObjectsLoaded: false,
    environmentLoaded: false,
    networkConnected: false,
    dialogConnected: false,
    lazyLoadMedia
  });

  const onObjectLoading = useCallback(
    () => {
      clearTimeout(loadingTimeoutRef.current);
      dispatch({ type: "object-loading" });
    },
    [dispatch]
  );

  const onObjectLoaded = useCallback(
    () => {
      clearTimeout(loadingTimeoutRef.current);

      dispatch({ type: "object-loaded" });

      // Objects can start loading as a result of loading another object. Wait 1.5 seconds before calling
      // all-objects-loaded to try to catch loading all objects.
      // TODO: Determine a better way to ensure the object dependency chain has resolved, or switch to a
      // progressive loading model where all objects don't have to be loaded to enter the room.
      loadingTimeoutRef.current = setTimeout(() => {
        dispatch({ type: "all-objects-loaded" });
      }, 1500);
    },
    [dispatch]
  );

  const onEnvironmentLoaded = useCallback(
    () => {
      dispatch({ type: "environment-loaded" });
    },
    [dispatch]
  );

  const onNetworkConnected = useCallback(
    () => {
      dispatch({ type: "network-connected" });
    },
    [dispatch]
  );

  const onDialogConnected = useCallback(
    () => {
      dispatch({ type: "dialog-connected" });
    },
    [dispatch]
  );

  useEffect(
    () => {
      // Once the scene has loaded the dependencies to this hook will change,
      // the event listeners will be removed, and we can prevent adding them again.
      if (loading) {
        if (!lazyLoadMedia) {
          sceneEl.addEventListener("model-loading", onObjectLoading);
          sceneEl.addEventListener("image-loading", onObjectLoading);
          sceneEl.addEventListener("pdf-loading", onObjectLoading);
          sceneEl.addEventListener("video-loading", onObjectLoading);
          sceneEl.addEventListener("model-loaded", onObjectLoaded);
          sceneEl.addEventListener("image-loaded", onObjectLoaded);
          sceneEl.addEventListener("pdf-loaded", onObjectLoaded);
          sceneEl.addEventListener("video-loaded", onObjectLoaded);
          sceneEl.addEventListener("model-error", onObjectLoaded);
        }
        sceneEl.addEventListener("environment-scene-loaded", onEnvironmentLoaded);
        sceneEl.addEventListener("didConnectToNetworkedScene", onNetworkConnected);
        sceneEl.addEventListener("didConnectToDialog", onDialogConnected);
      }

      return () => {
        if (!lazyLoadMedia) {
          sceneEl.removeEventListener("model-loading", onObjectLoading);
          sceneEl.removeEventListener("image-loading", onObjectLoading);
          sceneEl.removeEventListener("pdf-loading", onObjectLoading);
          sceneEl.removeEventListener("video-loading", onObjectLoading);
          sceneEl.removeEventListener("model-loaded", onObjectLoaded);
          sceneEl.removeEventListener("image-loaded", onObjectLoaded);
          sceneEl.removeEventListener("pdf-loaded", onObjectLoaded);
          sceneEl.removeEventListener("video-loaded", onObjectLoaded);
          sceneEl.removeEventListener("model-error", onObjectLoaded);
        }
        sceneEl.removeEventListener("environment-scene-loaded", onEnvironmentLoaded);
        sceneEl.removeEventListener("didConnectToNetworkedScene", onNetworkConnected);
        sceneEl.removeEventListener("didConnectToDialog", onDialogConnected);
      };
    },
    [
      sceneEl,
      loading,
      onObjectLoaded,
      onObjectLoading,
      onEnvironmentLoaded,
      onNetworkConnected,
      onDialogConnected,
      lazyLoadMedia
    ]
  );

  const intl = useIntl();

  const message = intl.formatMessage(messages[messageKey], {
    // Never show a loaded count that's greater than the object count
    loadedCount: Math.min(loadedCount, objectCount),
    objectCount
  });

  useEffect(
    () => {
      if (!loading) {
        // The loaded state on the scene signifies that the loading screen is no longer visible,
        // the initial scene was loaded, and the network connection is established.
        sceneEl.addState("loaded");
      }
    },
    [sceneEl, loading]
  );

  // Ensure timeout is cleared on unmount.
  useEffect(() => {
    () => {
      clearTimeout(loadingTimeoutRef.current);
    };
  }, []);

  return { loading, message };
}

export const copySittingToStandingTransform = function copySittingToStandingTransform(matrix) {
  navigator.getVRDisplays &&
    navigator.getVRDisplays().then(displays => {
      if (displays[0] && displays[0].stageParameters && displays[0].stageParameters.sittingToStandingTransform) {
        matrix.fromArray(displays[0].stageParameters.sittingToStandingTransform);
      } else {
        setTimeout(() => {
          copySittingToStandingTransform(matrix);
        }, 1000); // Try again when the display is ready
      }
    });
};

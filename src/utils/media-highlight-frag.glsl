if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo) {
  float ratio = 0.0;

  if (hubs_EnableSweepingEffect) {
    float size = hubs_SweepParams.t - hubs_SweepParams.s;
    float line = mod(hubs_Time / 3000.0 * size, size * 2.0) + hubs_SweepParams.s - size / 2.0;

    if (hubs_WorldPosition.y < line) {
      // Highlight with a sweeping gradient.
      ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / size * 3.0);
    }
  }

  // Highlight with a gradient falling off with distance.
  float pulse = 9.0 + 3.0 * (sin(hubs_Time / 1000.0) + 1.0);

  if (hubs_HighlightInteractorOne) {
    float dist1 = distance(hubs_WorldPosition, hubs_InteractorOnePos);
    ratio += -min(1.0, pow(dist1 * pulse, 3.0)) + 1.0;
  } 

  if (hubs_HighlightInteractorTwo) {
    float dist2 = distance(hubs_WorldPosition, hubs_InteractorTwoPos);
    ratio += -min(1.0, pow(dist2 * pulse, 3.0)) + 1.0;
  }

  ratio = min(1.0, ratio);

  // Gamma corrected highlight color
  vec3 highlightColor = vec3(0.184, 0.499, 0.933);

  gl_FragColor.rgb = (gl_FragColor.rgb * (1.0 - ratio)) + (highlightColor * ratio);
}

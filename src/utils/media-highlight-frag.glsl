if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo) {
  mat4 it;
  vec3 ip;
  float dist1, dist2;

  if (hubs_HighlightInteractorOne) {
    it = hubs_InteractorOneTransform;
    ip = vec3(it[3][0], it[3][1], it[3][2]);
    dist1 = distance(hubs_WorldPosition, ip);
  }

  if (hubs_HighlightInteractorTwo) {
    it = hubs_InteractorTwoTransform;
    ip = vec3(it[3][0], it[3][1], it[3][2]);
    dist2 = distance(hubs_WorldPosition, ip);
  }

  float size = hubs_SweepParams.t - hubs_SweepParams.s;
  float line = mod(hubs_Time / 3000.0 * size, size * 2.0) + hubs_SweepParams.s - size / 2.0;

  float ratio = 0.0;
  if (hubs_EnableSweepingEffect && hubs_WorldPosition.y < line) {
    // Highlight with an sweeping gradient
    ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / size * 3.0);
  }

  float pulse = sin(hubs_Time / 1000.0) + 1.0;
  // Highlight with a gradient falling off with distance.
  if (hubs_HighlightInteractorOne) {
    ratio += -min(1.0, pow(dist1 * (9.0 + 3.0 * pulse), 3.0)) + 1.0;
  } 
  if (hubs_HighlightInteractorTwo) {
    ratio += -min(1.0, pow(dist2 * (9.0 + 3.0 * pulse), 3.0)) + 1.0;
  }

  ratio = min(1.0, ratio);

  // Gamma corrected highlight color
  vec3 highlightColor = vec3(0.184, 0.499, 0.933);

  gl_FragColor.rgb = (gl_FragColor.rgb * (1.0 - ratio)) + (highlightColor * ratio);
}

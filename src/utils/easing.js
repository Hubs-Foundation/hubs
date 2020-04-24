export function easeOutQuadratic(t) {
  return t * (2 - t);
}
// Adapted from
// https://github.com/d3/d3-ease/blob/master/src/elastic.js#L18
export const elasticOut = (function() {
  const tau = 2 * Math.PI,
    a = 1,
    p = 0.3 / tau,
    s = Math.asin(1) * p;
  return function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  };
})();

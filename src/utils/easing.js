export function easeOutQuadratic(t) {
  return t * (2 - t);
}
// Adapted from
// https://github.com/d3/d3-ease/blob/master/src/elastic.js#L18
const tau = 2 * Math.PI,
  amplitude = 1,
  period = 0.3;
export const elasticOut = (function custom(a, p) {
  const s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function(a) {
    return custom(a, p * tau);
  };
  elasticOut.period = function(p) {
    return custom(a, p);
  };

  return elasticOut;
})(amplitude, period);

{
  window.foobar && window.foobar();
  const time = {};
  function onKeyDown(e) {
    if (time[e.key.toLowerCase()]) return;
    time[e.key.toLowerCase()] = performance.now();
    console.log("start", e.key.toLowerCase());
  }
  function onKeyUp(e) {
    console.log("end", e.key.toLowerCase(), ((performance.now() - time[e.key.toLowerCase()]) / 1000).toFixed(2));
    delete time[e.key.toLowerCase()];
  }
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  window.foobar = () => {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
  };
}

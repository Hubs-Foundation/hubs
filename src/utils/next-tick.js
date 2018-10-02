export default function nextTick() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

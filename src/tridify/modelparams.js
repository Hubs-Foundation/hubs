export function getModelHash() {
  const url = new URL(window.location.href);
  const model = url.searchParams.get("model");
  return model;
}

export default function traverseFilteredSubtrees(object, cb) {
  if (cb(object) === false) {
    return;
  }

  const children = object.children;

  for (let i = 0; i < children.length; i++) {
    traverseFilteredSubtrees(children[i], cb);
  }
}

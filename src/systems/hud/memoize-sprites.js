function readNorm(name, spritesheet) {
  const frame = spritesheet.frames[name].frame;
  const size = spritesheet.meta.size;
  return {
    x: frame.x / size.w,
    y: frame.y / size.h,
    w: frame.w / size.w,
    h: frame.h / size.h
  };
}

export const memoizeSprites = function(spritesheet) {
  const memo = new Map();
  return function sprite(name) {
    const memoizedSprite = memo.get(name);
    if (memoizedSprite) {
      return memoizedSprite;
    }
    const sprite = readNorm(name, spritesheet);
    memo.set(name, sprite);
    return sprite;
  };
};

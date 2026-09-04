export function hashToIndex(value, length) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash + char.codePointAt(0)) % length;
  }
  return hash;
}

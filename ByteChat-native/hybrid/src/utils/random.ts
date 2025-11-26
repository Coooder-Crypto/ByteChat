export function cryptoRandom() {
  if (window.crypto?.getRandomValues) {
    const buf = new Uint32Array(2);
    window.crypto.getRandomValues(buf);
    return `${buf[0].toString(16)}${buf[1].toString(16)}`;
  }
  return Math.random().toString(16).slice(2);
}

export function nearlyEqual(a, b) {
  if (a === b) {
    // shortcut, handles infinities
    return true;
  } else {
    // use relative error
    let diff = Math.abs(a - b);
    return diff <= Number.EPSILON * 3;
  }
}

import React from 'react';
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

export function msToTime(s) {
    // Pad to 2 or 3 digits, default is 2
    var pad = (n, z = 2) => ('00' + n).slice(-z);
    return (
        pad((s / 3.6e6) | 0) +
        ':' +
        pad(((s % 3.6e6) / 6e4) | 0) +
        ':' +
        pad(((s % 6e4) / 1000) | 0) +
        '.' +
        pad(s % 1000, 3)
    );
}

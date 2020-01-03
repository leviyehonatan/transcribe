import React from 'react';

export default function Marker({ location, type }) {
    return <div style={{ position: 'absolute', left: location }} />;
}

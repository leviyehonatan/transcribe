import React from 'react';

export default function Playhead({ audioBuffer, position, width }) {
    return (
        <div
            style={{
                height: '100%',
                width: '1px',
                position: 'absolute',
                backgroundColor: 'red',
                left: (position / audioBuffer.duration) * width,
            }}
        />
    );
}

import React, { useState } from 'react';
import Playhead from './Playhead';

export default function Overview({
    audioBuffer,
    playPosition,
    leftView,
    width,
    visibleWidth,
    setPosition,
}) {
    const [mouseDown, setMouseDown] = useState(false);

    return (
        <div
            onMouseUp={event => {
                console.log('up', event);
                setMouseDown(false);
            }}
            onMouseMove={event => {
                if (mouseDown) {
                    if (setPosition) {
                        setPosition(event.clientX);
                    }

                    console.log('move', event);
                }
            }}
            onMouseLeave={event => {
                console.log('leave', event);
            }}
            onMouseDown={event => {
                console.log('down', event, event.clientX);
                setMouseDown(true);
                if (setPosition) setPosition(event.clientX);
            }}
            id="overview"
            style={{
                position: 'relative',
                width: '100vw',
                height: '20px',
                backgroundColor: 'green',
            }}
        >
            <Playhead
                width={visibleWidth}
                audioBuffer={audioBuffer}
                position={playPosition}
            />
            <div
                id="visible-viewport"
                onMouseDown={event => {
                    console.log('down bar');
                    event.preventDefault();
                }}
                style={{
                    borderRadius: '3px',
                    left: `${(leftView / width) * 100}%`,
                    position: 'absolute',
                    backgroundColor: 'pink',
                    height: '100%',
                    width: `${(visibleWidth / width) * 100}%`,
                }}
            ></div>
        </div>
    );
}

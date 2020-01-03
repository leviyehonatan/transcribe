import React, { useEffect, useRef } from 'react';

export default function Timeline({
    scale,
    audioBuffer,
    markers,
    playStartPosition,
}) {
    const canvasRef = useRef();
    const width = audioBuffer.length / scale;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        if (playStartPosition) {
            const playStartPositionRelative =
                playStartPosition / audioBuffer.duration;
            const playStartX = playStartPositionRelative * width;
            context.beginPath();
            context.fillStyle = 'red';
            context.moveTo(playStartX, canvas.height);
            context.lineTo(playStartX - 10, canvas.height - 10);
            context.lineTo(playStartX + 10, canvas.height - 10);
            context.fill();
        }
    }, [playStartPosition, markers, audioBuffer, width]);

    return <canvas ref={canvasRef} width={width} height={30} />;
}

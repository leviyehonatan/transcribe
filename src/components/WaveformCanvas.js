import React, { useEffect, useRef } from 'react';
import { WaveFormCanvas } from './Waveform';

export default function WaveformCanvas({
    audioBuffer,
    samplesPerPixel,
    channelIndex,
    height = 100,
}) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const channelData = audioBuffer.getChannelData(channelIndex);
        if (audioBuffer == null) return;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        context.fillStyle = '#656687';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.fillStyle = 'green';
        for (let i = 0; i < audioBuffer.length / samplesPerPixel; i++) {
            let numAverageSamples = 0;
            let sum = 0;
            for (
                let j = 0;
                j < samplesPerPixel &&
                i * samplesPerPixel + j < audioBuffer.length;
                j++
            ) {
                sum += Math.abs(channelData[i * samplesPerPixel + j]);
                numAverageSamples++;
            }
            let peak = sum / numAverageSamples;

            const barHeight = canvas.height * peak;
            context.fillRect(i, (canvas.height - barHeight) / 2, 1, barHeight);
        }
    }, [audioBuffer, samplesPerPixel, channelIndex]);

    const width = audioBuffer.length / samplesPerPixel;
    return <canvas ref={canvasRef} width={width} height={height} />;
}

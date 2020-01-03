import React, { useEffect, useRef, useState, useCallback } from 'react';
import WaveformData from 'waveform-data';

export default function WaveformCanvas({
    audioBuffer,
    scale,
    channelIndex,
    height = 100,
}) {
    const canvasRef = useRef(null);
    const [waveform, setWaveform] = useState(null);
    const width = audioBuffer.length / scale;

    useEffect(() => {
        if (!waveform) return;
        console.log('drawing waveform');
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.beginPath();
        const channel = waveform.channel(channelIndex);
        const scaleY = (amplitude, height) => {
            const range = 256;
            const offset = 128;

            return height - ((amplitude + offset) * height) / range;
        };
        for (let x = 0; x < waveform.length; x++) {
            const val = channel.max_sample(x);
            context.lineTo(x + 0.5, scaleY(val, canvas.height) + 0.5);
        }
        for (let x = waveform.length - 1; x >= 0; x--) {
            const val = channel.min_sample(x);

            context.lineTo(x + 0.5, scaleY(val, canvas.height) + 0.5);
        }
        context.closePath();
        context.fillStyle = 'yellow';
        context.strokeStyle = 'red';
        context.stroke();
        context.fill();
    }, [waveform, channelIndex]);

    useEffect(() => {
        const options = {
            split_channels: true,
            audio_buffer: audioBuffer,
            width,
        };
        // if (waveform && scale <) {
        //     const resampledWaveform = waveform.resample(options);
        //     setWaveform(resampledWaveform);
        // } else {
        console.log('createFromAudio', options);
        WaveformData.createFromAudio(options, (err, waveform) => {
            console.log(waveform);
            setWaveform(waveform);
        });
        // }
    }, [audioBuffer, scale, channelIndex, height, width]);

    return <canvas ref={canvasRef} width={width} height={height} />;
}

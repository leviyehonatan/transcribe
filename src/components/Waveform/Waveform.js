import React, { useEffect, useState, useCallback, useRef } from 'react';
import Axios from 'axios';
import WaveformCanvas from './WaveformCanvas';
import Timeline from './Timeline';
import { msToTime } from '../../helpers/helper';
import { useKeyPress } from '../../hooks/keyPressHooks';
import { usePrevious, useAnimationFrame } from '../../hooks/hooks';

export default function Waveform({ src }) {
    const audioContextRef = useRef();
    const bufferSourceRef = useRef();

    const [audioBuffer, setAudioBuffer] = useState(null);

    const [msPerPixel, setMsPerPixel] = useState(50);

    const [playPosition, setPlayPosition] = useState(0);
    const playStartTime = useRef(null);
    const [isPlaying, setIsPlaying] = useState();

    const playPressed = useKeyPress(' ');
    const prevPlayPressed = usePrevious(playPressed);
    const [playStartPosition, setPlayStartPosition] = useState(0);

    const playPausePressed = useCallback(() => {
        console.log('playPausePressed');
        if (!isPlaying) {
            console.log('playing');
            playStartTime.current = audioContextRef.current.currentTime;
            bufferSourceRef.current = audioContextRef.current.createBufferSource();
            bufferSourceRef.current.buffer = audioBuffer;
            bufferSourceRef.current.loop = true;
            bufferSourceRef.current.connect(
                audioContextRef.current.destination,
            );
            console.log();
            bufferSourceRef.current.start(0, playStartPosition);
        } else {
            console.log('stopping');
            bufferSourceRef.current.stop();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, audioBuffer, playStartPosition]);

    useEffect(() => {
        if (playPressed && playPressed !== prevPlayPressed) {
            console.log('playPressed');
            playPausePressed();
        }
    }, [playPressed, playPausePressed, prevPlayPressed]);

    useAnimationFrame(
        deltaTime => {
            if (isPlaying) {
                const fromStart =
                    audioContextRef.current.currentTime - playStartTime.current;
                if (fromStart + playStartPosition > audioBuffer.duration);
                setPlayPosition(fromStart + playStartPosition);
            }
        },
        [isPlaying, playStartPosition],
    );

    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
    }, []);

    useEffect(() => {
        if (audioContextRef.current == null) return;
        console.log('loadFromUrl');

        const loadAudio = async () => {
            const response = await Axios({
                method: 'get',
                url: src,
                responseType: 'arraybuffer',
            });
            setAudioBuffer(
                await audioContextRef.current.decodeAudioData(response.data),
            );
        };
        loadAudio();
    }, [src]);

    const samplesPerPixel = audioBuffer
        ? (msPerPixel / 1000) * audioBuffer.sampleRate
        : null;

    const getWidth = useCallback(() => {
        return audioBuffer.length / samplesPerPixel;
    }, [audioBuffer, samplesPerPixel]);

    const waveClicked = useCallback(
        event => {
            let container = event.target.parentElement.parentElement;

            const actualX = container.scrollLeft + event.clientX;
            const relativePosition = actualX / getWidth();
            setPlayStartPosition(audioBuffer.duration * relativePosition);
        },
        [getWidth, audioBuffer],
    );

    if (audioBuffer == null) {
        return <div className="App">loading</div>;
    }

    const canvases = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        canvases.push(
            <WaveformCanvas
                key={i}
                audioBuffer={audioBuffer}
                channelIndex={i}
                samplesPerPixel={samplesPerPixel}
            />,
        );
    }

    const width = getWidth();

    return (
        <div>
            <div
                style={{
                    position: 'relative',
                    width: '100vw',
                    overflow: 'scroll',
                }}
            >
                <Timeline
                    playStartPosition={playStartPosition}
                    audioBuffer={audioBuffer}
                    samplesPerPixel={samplesPerPixel}
                />
                <div style={{ position: 'relative' }} onClick={waveClicked}>
                    <div
                        style={{
                            height: '100%',
                            width: '1px',
                            position: 'absolute',
                            backgroundColor: 'red',
                            left: (playPosition / audioBuffer.duration) * width,
                        }}
                    />
                    {canvases}
                </div>
            </div>
            <div>
                <title>statistics</title>
                <p>length: {msToTime(audioBuffer.duration * 1000)}</p>
                <p>current playing position: {msToTime(playPosition)}</p>
            </div>
        </div>
    );
}

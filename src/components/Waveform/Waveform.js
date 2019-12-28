import React, { useEffect, useState, useCallback, useRef } from 'react';
import WaveformCanvas from './WaveformCanvas';
import Timeline from './Timeline';
import { msToTime } from '../../helpers/helper';
import { useKeyPress } from '../../hooks/keyPressHooks';
import { usePrevious, useAnimationFrame } from '../../hooks/hooks';
import Player from '../Player/Player';

export default function Waveform({ src }) {
    const playerRef = useRef();

    const [msPerPixel, setMsPerPixel] = useState(30);

    const [isReady, setIsReady] = useState(false);

    const [playPosition, setPlayPosition] = useState(0);

    const playPressed = useKeyPress(' ');
    const prevPlayPressed = usePrevious(playPressed);
    const [playStartPosition, setPlayStartPosition] = useState(0);

    useEffect(() => {
        if (playPressed && playPressed !== prevPlayPressed) {
            const player = playerRef.current;
            console.log('playPressed');
            if (!player.isPlaying) {
                console.log('playing', playStartPosition);
                player.play(playStartPosition);
            } else {
                console.log('stopping');
                player.stop();
            }
        }
    }, [playPressed, prevPlayPressed, playStartPosition]);

    useAnimationFrame(
        deltaTime => {
            if (playerRef.current.isPlaying) {
                setPlayPosition(playerRef.current.position);
            }
        },
        [playStartPosition],
    );

    useEffect(() => {
        playerRef.current = new Player();
    }, []);

    useEffect(() => {
        if (playerRef.current == null) return;
        console.log('load');
        const load = async () => {
            await playerRef.current.load(src);
            console.log('loaded');
            setIsReady(true);
            console.log('ready');
        };
        load();
    }, [src]);

    if (!isReady) {
        return <div className="App">loading</div>;
    }

    const audioBuffer = playerRef.current.audioBuffer;
    const samplesPerPixel = audioBuffer
        ? (msPerPixel / 1000) * audioBuffer.sampleRate
        : null;
    const width = audioBuffer.length / samplesPerPixel;

    const waveClicked = event => {
        let container = event.target.parentElement.parentElement;
        const actualX = container.scrollLeft + event.clientX;
        console.log(container);
        const relativePosition = actualX / width;
        setPlayStartPosition(audioBuffer.duration * relativePosition);
    };

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

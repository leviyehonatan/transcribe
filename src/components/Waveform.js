import React, { useEffect, useState, useRef, useContext } from 'react';
import WaveformCanvas from './WaveformCanvas';
import Timeline from './Timeline';
import { msToTime } from '../helpers/helper';
import { useKeyPress } from '../hooks/keyPressHooks';
import { usePrevious, useAnimationFrame } from '../hooks/hooks';
import Player from './Player';
import Playhead from './Playhead';
import PlaySettingsContext from './PlaySettingsContext';
import Overview from './Overview';
import './Style.css';

export default function Waveform({ src }) {
    const playerRef = useRef();
    const waveformContainerRef = useRef();

    const playSettings = useContext(PlaySettingsContext);
    const [scale, setScale] = useState(512);

    const [leftScroll, setLeftScroll] = useState(0);

    const [isReady, setIsReady] = useState(false);

    const [playPosition, setPlayPosition] = useState(0);

    const playPressed = useKeyPress(' ');
    const prevPlayPressed = usePrevious(playPressed);

    const metaPressed = useKeyPress(91);
    const [playStartPosition, setPlayStartPosition] = useState(0);

    const [detuneSemitones, setDetuneSemitones] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    useEffect(() => {
        if (playPressed && playPressed !== prevPlayPressed) {
            const player = playerRef.current;
            if (!player.isPlaying) {
                player.play(playStartPosition);
            } else {
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
        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 32 && e.target === document.body) {
                e.preventDefault();
            }
        });
    }, []);

    useEffect(() => {
        if (playerRef.current == null) return;
        const load = async () => {
            await playerRef.current.load(src);
            setIsReady(true);
        };
        load();
    }, [src]);

    useEffect(() => {
        const player = playerRef.current;
        if (!player) return;
        if (player.isPlaying) {
            player.stop();
            player.play(playStartPosition);
        }
    }, [playStartPosition, playerRef]);

    useEffect(() => {
        const player = playerRef.current;
        if (player == null) return;
        player.detuneSemitones = detuneSemitones;
    }, [detuneSemitones]);

    useEffect(() => {
        const player = playerRef.current;
        if (player == null) return;
        player.playbackSpeed = playbackSpeed;
    }, [playbackSpeed]);

    if (!isReady) {
        return <div className="App">loading</div>;
    }

    const audioBuffer = playerRef.current.audioBuffer;
    const width = audioBuffer.length / scale;

    const waveClicked = event => {
        let container = event.target.parentElement.parentElement;
        const actualX = container.scrollLeft + event.clientX;
        const relativePosition = actualX / width;
        setPlayStartPosition(audioBuffer.duration * relativePosition);
    };

    const canvases = [];
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
        canvases.push(
            <WaveformCanvas
                key={i}
                scale={scale}
                audioBuffer={audioBuffer}
                channelIndex={i}
            />,
        );
    }

    const waveformContainer = waveformContainerRef.current;

    return (
        <div className="nofocus">
            <div
                id="waveform-container"
                ref={waveformContainerRef}
                onScroll={event => {
                    setLeftScroll(event.target.scrollLeft);
                }}
                scrollLeft={leftScroll}
                style={{
                    position: 'relative',
                    width: '100vw',
                    overflow: 'scroll',
                }}
            >
                <Timeline
                    playStartPosition={playStartPosition}
                    audioBuffer={audioBuffer}
                    scale={scale}
                />
                <div style={{ position: 'relative' }} onClick={waveClicked}>
                    <Playhead
                        width={width}
                        audioBuffer={audioBuffer}
                        position={playPosition}
                    />
                    {canvases}
                </div>
            </div>
            <Overview
                audioBuffer={audioBuffer}
                playPosition={playPosition}
                leftView={leftScroll}
                width={width}
                visibleWidth={
                    waveformContainer ? waveformContainer.offsetWidth : 0
                }
            />
            <div style={{ flex: 1, flexDirection: 'row' }}>
                <div id="scale">
                    <div>
                        scale - {scale}
                        <button
                            onClick={() => {
                                setScale(Math.min(scale / 1.2, 2048));
                            }}
                        >
                            -
                        </button>
                        <button
                            onClick={() => {
                                setScale(Math.min(scale * 1.2, 2048));
                            }}
                        >
                            +
                        </button>
                        <button
                            onClick={() => {
                                const fullWidth =
                                    waveformContainerRef.current.offsetWidth;
                                console.log('fullwidth', fullWidth);
                                setScale(audioBuffer.length / fullWidth);
                            }}
                        >
                            zoom All
                        </button>
                        <input
                            type="range"
                            value={scale}
                            onChange={e => setScale(Number(e.target.value))}
                            step={1}
                            min={256}
                            max={1024}
                        />
                    </div>
                    <p>{detuneSemitones}</p>
                </div>
                <div id="pitch shift">
                    <div>
                        pitch shift(semitones) -
                        <input
                            type="range"
                            value={detuneSemitones}
                            onChange={e =>
                                setDetuneSemitones(Number(e.target.value))
                            }
                            step={1}
                            min={-12}
                            max={12}
                        />
                    </div>
                    <p>{detuneSemitones}</p>
                </div>
                <div id="speed">
                    <div>
                        speed 0
                        <input
                            type="range"
                            value={playbackSpeed}
                            onChange={e => setPlaybackSpeed(e.target.value)}
                            step={0.01}
                            min={0}
                            max={2}
                        />
                        2
                    </div>
                    <div>{playbackSpeed}</div>
                </div>
            </div>
            <div>
                <title>statistics</title>
                <p>width: {width}</p>
                <p>length: {msToTime(audioBuffer.duration * 1000)}</p>
                <p>current playing position: {msToTime(playPosition)}</p>
            </div>
        </div>
    );
}

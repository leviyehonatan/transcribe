import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
    useContext,
} from 'react';
import WaveformCanvas from './WaveformCanvas';
import Timeline from './Timeline';
import { msToTime } from '../../helpers/helper';
import { useKeyPress } from '../../hooks/keyPressHooks';
import { usePrevious, useAnimationFrame } from '../../hooks/hooks';
import Player from '../Player/Player';
import Playhead from './Playhead';
import PlaySettingsContext from './PlaySettingsContext';

export default function Waveform({ src }) {
    const playerRef = useRef();

    const playSettings = useContext(PlaySettingsContext);
    const [msPerPixel, setMsPerPixel] = useState(30);

    const [isReady, setIsReady] = useState(false);

    const [playPosition, setPlayPosition] = useState(0);

    const playPressed = useKeyPress(' ');
    const prevPlayPressed = usePrevious(playPressed);
    const [playStartPosition, setPlayStartPosition] = useState(0);

    const [detuneSemitones, setDetuneSemitones] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

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

    const zoomScroll = useCallback(event => {
        if (event.metaKey) {
            console.log('meta scroll');
        }
    }, []);

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
                onScroll={event => {
                    if (event.metaKey) event.preventDefault();
                }}
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
                <div
                    style={{ position: 'relative' }}
                    onClick={waveClicked}
                    onScroll={zoomScroll}
                >
                    <Playhead
                        width={width}
                        audioBuffer={audioBuffer}
                        position={playPosition}
                    />
                    {canvases}
                </div>
            </div>
            <div>
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
                <p>length: {msToTime(audioBuffer.duration * 1000)}</p>
                <p>current playing position: {msToTime(playPosition)}</p>
            </div>
        </div>
    );
}

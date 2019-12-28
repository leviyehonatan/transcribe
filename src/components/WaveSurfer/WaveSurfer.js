import React, { useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimeLine from './wavesurfer.markers';
import useKeyPress, { useMultiKeyPress } from '../../hooks/keyPressHooks';
import { useDropzone } from 'react-dropzone';
import SoundTouch from '../../processing/soundtouch';
import { MarkerTypes } from '../../types/types';
import { nearlyEqual } from '../../helpers/helper';

import './WaveSurfer.css';

const ZOOM_RANGE = {
    min: 20,
    max: 200,
};

export default function(args) {
    const [fineTune, setFineTune] = useState(0);
    const [waveSurfer, setWaveSurfer] = useState();
    const [soundTouchObj, setSoundTouchObj] = useState();
    const [zoom, setZoom] = useState(50);
    const [speed, setSpeed] = useState(1);
    const [pitchShift, setPitchShift] = useState(0);
    const [surferReady, setSurferReady] = useState(false);
    const playPressed = useKeyPress(' ');
    const beatPressed = useKeyPress('b');
    const measurePressed = useKeyPress('m');
    const deletePressed = useKeyPress(8);
    const prevMeasureMarkerPressed = useKeyPress('[');
    const nextMeasureMarkerPressed = useKeyPress(']');
    const prevBeatMarkerPressed = useKeyPress('{');
    const nextBeatMarkerPressed = useKeyPress('}');
    const zoomInPressed = useKeyPress('j');
    const zoomOutPressed = useKeyPress('h');
    const savePressed = useKeyPress('s');

    const onDrop = useCallback(
        acceptedFiles => {
            let firstFile = acceptedFiles[0];
            waveSurfer.loadBlob(firstFile);
        },
        [waveSurfer],
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
    });

    const searchMarker = useCallback(
        (type, prev) => {
            console.log('searching marker', type, prev);
            let markers = waveSurfer.params.markers;
            if (markers.length === 0) return;
            let now = waveSurfer.getCurrentTime();

            for (let i = 0; i < markers.length; i++) {
                let current = markers[i];
                let next = markers[i + 1];

                if (
                    (prev && // prev
                        current.when < now &&
                        (!next ||
                            ((next.when > now || nearlyEqual(next.when, now)) &&
                                (type === MarkerTypes.BEAT ||
                                    (type === MarkerTypes.MEASURE &&
                                        current.type ===
                                            MarkerTypes.MEASURE))))) ||
                    (!prev && // next
                        next &&
                        //(current.when < now || nearlyEqual(current.when, now)) &&
                        next.when > now &&
                        (type === MarkerTypes.BEAT ||
                            (type === MarkerTypes.MEASURE &&
                                next.type === MarkerTypes.MEASURE)))
                ) {
                    waveSurfer.seekAndCenter(
                        markers[prev ? i : i + 1].when /
                            waveSurfer.getDuration(),
                    );
                    break;
                }
            }
        },
        [waveSurfer],
    );

    useEffect(() => {
        if (!waveSurfer) return;
        if (prevMeasureMarkerPressed) searchMarker(MarkerTypes.MEASURE, true);
        if (nextMeasureMarkerPressed) searchMarker(MarkerTypes.MEASURE, false);
        if (prevBeatMarkerPressed) searchMarker(MarkerTypes.BEAT, true);
        if (nextBeatMarkerPressed) searchMarker(MarkerTypes.BEAT, false);
    }, [
        waveSurfer,
        prevMeasureMarkerPressed,
        nextMeasureMarkerPressed,
        prevBeatMarkerPressed,
        nextBeatMarkerPressed,
        searchMarker,
    ]);

    useEffect(() => {
        if (!waveSurfer) return;
        if (deletePressed) {
            console.log('now', waveSurfer.getCurrentTime());
            let markers = waveSurfer.params.markers;
            let toDelete;
            for (let i = 0; i < markers.length; i++) {
                if (nearlyEqual(markers[i].when, waveSurfer.getCurrentTime())) {
                    toDelete = i;
                    break;
                }
            }
            if (toDelete) {
                console.log('deleting', markers[toDelete]);
                markers.splice(toDelete, 1);
                waveSurfer.fireEvent('redraw');
            } else {
                console.log('nothing found to delete');
            }
        }
    }, [waveSurfer, deletePressed]);

    const resetMarkers = useCallback(() => {
        waveSurfer.params.markers = [];
        waveSurfer.fireEvent('redraw');
        localStorage.setItem('markers', null);
    }, [waveSurfer]);

    useEffect(() => {
        if (!waveSurfer) return;
        console.log('registering backend-craeted');
        waveSurfer.on('backend-created', () => {
            console.log('backend-created');
        });
    }, [waveSurfer]);
    useEffect(() => {
        if (!waveSurfer) {
            console.log('loadMarkers', loadMarkers());
            setWaveSurfer(
                WaveSurfer.create({
                    container: '#waveform',
                    waveColor: 'violet',
                    height: 300,
                    progressColor: 'violet',
                    fillParent: true,
                    markers: loadMarkers() || [],
                    plugins: [
                        TimeLine.create({
                            container: '#timeline',
                        }),
                    ],
                }),
            );
        }
    }, [waveSurfer]);

    const saveMarkers = useCallback(() => {
        console.log('saving markers');
        localStorage.setItem(
            'markers',
            JSON.stringify(waveSurfer.params.markers),
        );
    }, [waveSurfer]);

    function loadMarkers() {
        try {
            let markers = localStorage.getItem('markers');
            return JSON.parse(markers);
        } catch (e) {
            return null;
        }
    }

    useEffect(() => {
        if (WaveSurfer && savePressed) saveMarkers();
    }, [waveSurfer, savePressed, saveMarkers]);

    useEffect(() => {
        if (waveSurfer) waveSurfer.load('sample.mp3');
    }, [waveSurfer]);

    const playPausePressed = useCallback(() => {
        console.log('playPause');
        if (waveSurfer.isPlaying()) {
            waveSurfer.pause();
        } else {
            waveSurfer.play(waveSurfer.params.startLocation);
        }
    }, [waveSurfer]);

    const addMarker = useCallback(
        type => {
            if (!waveSurfer) return;
            let when = waveSurfer.getCurrentTime();
            // check there's no existing marker at this exact timeline
            let existing = waveSurfer.params.markers.find(
                marker => marker.when === when,
            );
            if (existing) {
                // convert to desired type
                if (existing.type !== type) {
                    existing.type = type;
                    waveSurfer.fireEvent('redraw');
                }
                return;
            }
            waveSurfer.fireEvent('marker-added', {
                when,
                type,
            });
        },
        [waveSurfer],
    );

    useEffect(() => {
        if (playPressed) {
            playPausePressed();
        }
    }, [playPressed, playPausePressed]);

    useEffect(() => {
        if (!waveSurfer) return;

        let soundTouch = null;
        let source = null;
        waveSurfer.on('ready', () => {
            console.log('onready');
            soundTouch = new SoundTouch.SoundTouch(
                waveSurfer.backend.ac.sampleRate,
            );
            let buffer = waveSurfer.backend.buffer;
            let channels = buffer.numberOfChannels;
            let l = buffer.getChannelData(0);
            let r = channels > 1 ? buffer.getChannelData(1) : l;
            let length = buffer.length;
            source = {
                extract: function(target, numFrames, position) {
                    for (let i = 0; i < numFrames; i++) {
                        target[i * 2] = l[i + position];
                        target[i * 2 + 1] = r[i + position];
                    }

                    return Math.min(numFrames, length - position);
                },
            };
            setSoundTouchObj({
                soundTouch,
                source,
                length,
            });
            setSurferReady(true);
        });

        // document.getElementById("waveform").addEventListener("wheel", e => {
        //   e.stopPropagation();
        //   let newZoom = zoom + e.deltaY;
        //   if (newZoom < ZOOM_RANGE.min) newZoom = ZOOM_RANGE.min;
        //   if (newZoom > ZOOM_RANGE.max) newZoom = ZOOM_RANGE.max;
        //   setZoom(newZoom);
        // });

        return () => {
            if (waveSurfer) {
                waveSurfer.un('ready');
            }
        };
    }, [waveSurfer]);

    const zoomByFactor = useCallback(
        factor => {
            let newZoom = zoom * factor;
            if (newZoom > 200) newZoom = 200;
            if (newZoom < 20) newZoom = 20;

            setZoom(newZoom);
        },
        [zoom],
    );

    useEffect(() => {
        if (!zoomInPressed && !zoomOutPressed) return;
        const factor = 1.25;
        zoomByFactor(zoomInPressed ? factor : 1 / factor);
    }, [zoomInPressed, zoomOutPressed, zoomByFactor]);

    useEffect(() => {
        if (!waveSurfer) return;
        waveSurfer.on('error', function(e) {
            console.warn(e);
            //      waveSurfer.play();
        });
    }, [waveSurfer]);

    useEffect(() => {
        if (!waveSurfer) return;
        waveSurfer.on('play', function(e) {
            console.log('onplay');
            soundTouchObj.soundTouch.tempo = waveSurfer.getPlaybackRate();

            let filter = new SoundTouch.SimpleFilter(
                soundTouchObj.source,
                soundTouchObj.soundTouch,
            );
            filter.sourcePosition = ~~(
                waveSurfer.backend.getPlayedPercents() * soundTouchObj.length
            );
            if (pitchShift !== 0 || fineTune !== 0) {
                soundTouchObj.soundTouch.pitchSemitones =
                    pitchShift + fineTune / 50;
            }

            soundTouchObj.soundtouchNode = SoundTouch.getWebAudioNode(
                waveSurfer.backend.ac,
                filter,
            );

            waveSurfer.backend.setFilter(soundTouchObj.soundtouchNode);
        });
        return () => {
            waveSurfer.un('play');
        };
    }, [soundTouchObj, waveSurfer, pitchShift, fineTune]);

    useEffect(() => {
        if (!waveSurfer) return;
        if (waveSurfer.isPlaying()) {
            // we need to re-generate the filter to apply the pitch shift
            waveSurfer.pause();
            waveSurfer.play();
        }
    }, [waveSurfer, pitchShift, fineTune]);

    useEffect(() => {
        if (!waveSurfer) return;

        waveSurfer.on('pause', function() {
            console.log('onpause');
            soundTouchObj &&
                soundTouchObj.soundtouchNode &&
                soundTouchObj.soundtouchNode.disconnect();
        });
        return () => {
            waveSurfer.un('pause');
        };
    }, [waveSurfer, soundTouchObj]);

    useEffect(() => {
        if (!waveSurfer) return;
        waveSurfer.on('seek', function(e, e1) {
            console.log('seek', waveSurfer.getCurrentTime(), e, e1);
            waveSurfer.params.startLocation = waveSurfer.getCurrentTime();
        });
        return () => {
            waveSurfer.un('seek');
        };
    }, [waveSurfer, soundTouchObj]);

    useEffect(() => {
        if (waveSurfer) {
            console.log('setting zoom to ', zoom);
            waveSurfer.zoom(zoom);
        }
    }, [waveSurfer, zoom]);

    useEffect(() => {
        if (waveSurfer) waveSurfer.setPlaybackRate(speed);
    }, [waveSurfer, speed]);

    useEffect(() => {
        if (!waveSurfer) return;
        waveSurfer.on('zoom', () => {
            console.log('zoom');
        });
    });

    useEffect(() => {
        if (!measurePressed && !beatPressed) return;
        let type;
        if (measurePressed) type = MarkerTypes.MEASURE;
        if (beatPressed) type = MarkerTypes.BEAT;
        addMarker(type);
    }, [waveSurfer, addMarker, beatPressed, measurePressed]);

    return (
        <div>
            {surferReady ? '' : <div>Loading...</div>}
            <div>
                <div id="timeline"></div>
                <div id="waveform"></div>
            </div>
            <div className="settings">
                <div>
                    <div>
                        <button
                            type="button"
                            onClick={e => {
                                searchMarker(MarkerTypes.BEAT, true);
                            }}
                        >
                            previous beat
                        </button>
                        <button
                            type="button"
                            onClick={e => {
                                searchMarker(MarkerTypes.BEAT, false);
                            }}
                        >
                            next beat
                        </button>
                        <button
                            type="button"
                            onClick={e => {
                                searchMarker(MarkerTypes.MEASURE, true);
                            }}
                        >
                            previous measure
                        </button>
                        <button
                            type="button"
                            onClick={e => {
                                searchMarker(MarkerTypes.MEASURE, false);
                            }}
                        >
                            next measure
                        </button>
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={e => {
                                addMarker(MarkerTypes.BEAT);
                            }}
                        >
                            Add Beat Marker
                        </button>
                        <button
                            type="button"
                            onClick={e => {
                                addMarker(MarkerTypes.MEASURE);
                            }}
                        >
                            Add Measure Marker
                        </button>
                    </div>
                    <div>
                        <button type="button" onClick={() => saveMarkers()}>
                            Save Markers
                        </button>
                        <button type="button" onClick={() => resetMarkers()}>
                            Reset Markers
                        </button>
                    </div>
                    <div>
                        {' '}
                        <button
                            type="button"
                            onClick={e => {
                                playPausePressed();
                            }}
                        >
                            Play/Pause
                        </button>
                    </div>
                    <div {...getRootProps()}>
                        <input {...getInputProps()} />

                        {isDragActive ? (
                            <p>Drop the files here ...</p>
                        ) : (
                            <button>
                                Drag 'n' drop some files here, or click here to
                                select files
                            </button>
                        )}
                    </div>
                    <div id="speed">
                        <div>
                            speed 0
                            <input
                                type="range"
                                value={speed}
                                onChange={e => setSpeed(e.target.value)}
                                step={0.01}
                                min={0}
                                max={2}
                            />
                            2
                        </div>
                        <div>{speed}</div>
                    </div>
                    <div>
                        <div>
                            pitch shift(semitones) -
                            <input
                                type="range"
                                value={pitchShift}
                                onChange={e =>
                                    setPitchShift(Number(e.target.value))
                                }
                                step={1}
                                min={-12}
                                max={12}
                            />
                        </div>
                        <p>{pitchShift}</p>
                    </div>
                    <div>
                        <div>
                            fine tune(cents) -
                            <input
                                type="range"
                                value={fineTune}
                                onChange={e =>
                                    setFineTune(Number(e.target.value))
                                }
                                step={1}
                                min={-50}
                                max={50}
                            />
                        </div>
                        <p>{fineTune}</p>
                    </div>

                    <div id="zoom">
                        <div>
                            zoom
                            <input
                                type="range"
                                value={zoom}
                                onChange={e => setZoom(e.target.value)}
                                min={ZOOM_RANGE.min}
                                max={ZOOM_RANGE.max}
                                step="10"
                            ></input>
                        </div>
                        <div>{zoom}</div>
                    </div>
                </div>
            </div>
            <div>
                Keyboard: space - play/pause, b - beat marker, m - measure
                marker, [/] - next/prev marker, {'{ / }'} - next/prev beat,
                backspace - delete current marker
            </div>
        </div>
    );
}

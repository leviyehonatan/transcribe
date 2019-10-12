import React, { useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import TimeLine from "./wavesurfer.markers";
import { useKeyPress } from "./keyPressHooks";
import { useDropzone } from "react-dropzone";
import SoundTouch from "./soundtouch";
import { MarkerTypes } from "./types";
import { nearlyEqual } from "./helper";

import "./WaveSurfer.css";

const ZOOM_RANGE = {
  min: 20,
  max: 200
};

export default function(args) {
  const [fineTune, setFineTune] = useState(0);
  const [waveSurfer, setWaveSurfer] = useState();
  const [soundTouchObj, setSoundTouchObj] = useState();
  const [startLocation, setStartLocation] = useState(null);
  const [zoom, setZoom] = useState(50);
  const [speed, setSpeed] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);
  const [surferReady, setSurferReady] = useState(false);
  const playPressed = useKeyPress(" ");
  const beatPressed = useKeyPress("b");
  const measurePressed = useKeyPress("m");
  const deletePressed = useKeyPress(8);
  const resetMarkersPressed = useKeyPress("r");
  const prevMarkerPressed = useKeyPress("[");
  const nextMarkerPressed = useKeyPress("]");
  const selectedMarker = useState();

  const onDrop = useCallback(
    acceptedFiles => {
      console.log("acceptedFiles", acceptedFiles);
      let firstFile = acceptedFiles[0];
      console.log(firstFile);
      console.log();
      waveSurfer.loadBlob(firstFile);
    },
    [waveSurfer]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  useEffect(() => {
    if (!waveSurfer) return;
    if (!nextMarkerPressed && !prevMarkerPressed) return;

    let markers = waveSurfer.params.markers;
    if (markers.length === 0) return;
    let now = waveSurfer.getCurrentTime();
    let found;

    for (let i = 0; i < markers.length; i++) {
      let current = markers[i];
      let next = markers[i + 1];

      if (!next) {
        found = i;
        break;
      } else if (
        (nearlyEqual(current.when, now) || current.when < now) &&
        next.when > now
      ) {
        found = i;
        break;
      }
    }
    if (prevMarkerPressed && found === 0) return;
    if (nextMarkerPressed && found === markers.length - 1) return;
    let newMarkerIndex = prevMarkerPressed
      ? now > markers[found].when // prevMarkerPressed
        ? found
        : found - 1 // next
      : now < markers[found].when // nextMarkerPressed
      ? found
      : found + 1;
    console.log("newMarkerIndex", newMarkerIndex);
    waveSurfer.seekAndCenter(
      markers[newMarkerIndex].when / waveSurfer.getDuration()
    );
  }, [waveSurfer, prevMarkerPressed, nextMarkerPressed]);

  useEffect(() => {
    if (!waveSurfer) return;
    if (deletePressed) {
      console.log("now", waveSurfer.getCurrentTime());
      let markers = waveSurfer.params.markers;
      let toDelete;
      for (let i = 0; i < markers.length; i++) {
        if (nearlyEqual(markers[i].when, waveSurfer.getCurrentTime())) {
          toDelete = i;
          break;
        }
      }
      if (toDelete) {
        console.log("deleting", markers[toDelete]);
        markers.splice(toDelete, 1);
        waveSurfer.fireEvent("redraw");
      } else {
        console.log("nothing found to delete");
      }
    }
  }, [waveSurfer, deletePressed]);

  useEffect(() => {
    if (!waveSurfer && !resetMarkersPressed) return;
    waveSurfer.params.markers = [];
    waveSurfer.fireEvent("redraw");
  }, [waveSurfer, resetMarkersPressed]);

  useEffect(() => {
    if (!waveSurfer) return;
    console.log("registering backend-craeted");
    waveSurfer.on("backend-created", () => {
      console.log("backend-created");
    });
  }, [waveSurfer]);
  useEffect(() => {
    if (!waveSurfer) {
      setWaveSurfer(
        WaveSurfer.create({
          container: "#waveform",
          waveColor: "violet",
          height: 300,
          progressColor: "violet",
          fillParent: true,
          markers: [],
          plugins: [
            TimeLine.create({
              container: "#timeline"
            })
          ]
        })
      );
    }
  }, [waveSurfer]);

  useEffect(() => {
    if (waveSurfer) waveSurfer.load("sample.mp3");
  }, [waveSurfer]);

  const playPausePressed = useCallback(() => {
    console.log("playPause");
    if (waveSurfer.isPlaying()) {
      waveSurfer.pause();
    } else {
      waveSurfer.play(startLocation);
    }
  }, [waveSurfer, startLocation]);

  const addMarker = useCallback(
    type => {
      if (!waveSurfer) return;
      let when = waveSurfer.getCurrentTime();
      // check there's no existing marker at this exact timeline
      let existing = waveSurfer.params.markers.find(
        marker => marker.when === when
      );
      if (existing) return;
      console.log("adding marker");
      waveSurfer.fireEvent("marker-added", {
        when,
        type
      });
    },
    [waveSurfer]
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
    waveSurfer.on("ready", () => {
      console.log("onready");
      soundTouch = new SoundTouch.SoundTouch(waveSurfer.backend.ac.sampleRate);
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
        }
      };
      setSoundTouchObj({
        soundTouch,
        source,
        length
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
        waveSurfer.un("ready");
      }
    };
  }, [waveSurfer]);

  useEffect(() => {
    if (!waveSurfer) return;
    waveSurfer.on("error", function(e) {
      console.warn(e);
      //      waveSurfer.play();
    });
  }, [waveSurfer]);

  useEffect(() => {
    if (!waveSurfer) return;
    waveSurfer.on("play", function(e) {
      console.log("onplay");
      soundTouchObj.soundTouch.tempo = waveSurfer.getPlaybackRate();

      let filter = new SoundTouch.SimpleFilter(
        soundTouchObj.source,
        soundTouchObj.soundTouch
      );
      filter.sourcePosition = ~~(
        waveSurfer.backend.getPlayedPercents() * soundTouchObj.length
      );
      if (pitchShift !== 0 || fineTune !== 0) {
        soundTouchObj.soundTouch.pitchSemitones = pitchShift + fineTune / 50;
      }

      soundTouchObj.soundtouchNode = SoundTouch.getWebAudioNode(
        waveSurfer.backend.ac,
        filter
      );

      waveSurfer.backend.setFilter(soundTouchObj.soundtouchNode);
    });
    return () => {
      waveSurfer.un("play");
    };
  }, [soundTouchObj, waveSurfer, startLocation, pitchShift, fineTune]);

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

    waveSurfer.on("pause", function() {
      console.log("onpause");
      soundTouchObj &&
        soundTouchObj.soundtouchNode &&
        soundTouchObj.soundtouchNode.disconnect();
    });
    return () => {
      waveSurfer.un("pause");
    };
  }, [waveSurfer, soundTouchObj]);

  useEffect(() => {
    if (!waveSurfer) return;
    waveSurfer.on("seek", function(e, e1) {
      console.log("seek", waveSurfer.getCurrentTime(), e, e1);
      setStartLocation(waveSurfer.getCurrentTime());
    });
    return () => {
      waveSurfer.un("seek");
    };
  }, [waveSurfer, soundTouchObj]);

  useEffect(() => {
    if (waveSurfer) waveSurfer.zoom(zoom);
  }, [waveSurfer, zoom]);

  useEffect(() => {
    if (waveSurfer) waveSurfer.setPlaybackRate(speed);
  }, [waveSurfer, speed]);

  useEffect(() => {
    if (!waveSurfer) return;
    waveSurfer.on("zoom", () => {
      console.log("zoom");
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
      {surferReady ? "" : <div>Loading...</div>}
      <div>
        <div id="timeline"></div>
        <div id="waveform"></div>
      </div>
      <div className="settings">
        <div>
          <div>
            {" "}
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
            {" "}
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
                Drag 'n' drop some files here, or click here to select files
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
                onChange={e => setPitchShift(Number(e.target.value))}
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
                onChange={e => setFineTune(Number(e.target.value))}
                step={1}
                min={-50}
                max={50}
              />
            </div>
            <p>{fineTune}</p>
          </div>

          <div id="zoom">
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
        </div>
      </div>
    </div>
  );
}

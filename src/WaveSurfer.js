import React, { useEffect, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import TimeLine from "wavesurfer.js/dist/plugin/wavesurfer.timeline";
import MyTimeLine from "./wavesurfer.markers";
import { useKeyPress } from "./keyPressHooks";
import { useDropzone } from "react-dropzone";
import SoundTouch from "./soundtouch";

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
    if (!waveSurfer) {
      setWaveSurfer(
        WaveSurfer.create({
          container: "#waveform",
          waveColor: "violet",
          height: 300,
          progressColor: "violet",
          fillParent: true,
          plugins: [
            MyTimeLine.create({
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
    if (waveSurfer.isPlaying()) {
      waveSurfer.pause();
    } else {
      console.log("starting to play at", startLocation);
      waveSurfer.play(startLocation);
    }
  }, [waveSurfer, startLocation]);

  useEffect(() => {
    if (playPressed) {
      playPausePressed();
    }
  }, [playPressed, playPausePressed]);

  useEffect(() => {
    console.log("registering ready play etc.", waveSurfer);
    if (!waveSurfer) return;

    let soundTouch = null;
    let source = null;
    waveSurfer.on("ready", () => {
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

    waveSurfer.on("pause", function() {
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
  });

  // useEffect(() => {
  //   if (beatPressed) {
  //     timeline.params.markers.push({
  //       when: waveSurfer.getCurrentTime(),
  //       type: "BEAT"
  //     });
  //     waveSurfer.zoom(zoom);
  //   }
  // }, [beatPressed]);
  return (
    <div>
      {surferReady ? "" : <div>Loading...</div>}
      <div>
        <div id="timeline"></div>
        <div id="waveform"></div>
      </div>
      <div className="settings">
        <div>
          <button
            type="button"
            onClick={e => {
              playPausePressed();
            }}
          >
            Play/Pause
          </button>
          <div {...getRootProps()}>
            <input {...getInputProps()} />

            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>Drag 'n' drop some files here, or click to select files</p>
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

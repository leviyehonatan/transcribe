import React, { useEffect, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import TimeLine from "wavesurfer.js/dist/plugin/wavesurfer.timeline";
import MyTimeLine from "./wavesurfer.markers";
import { useKeyPress } from "./keyPressHooks";
import SoundTouch from "./soundtouch";

const ZOOM_RANGE = {
  min: 20,
  max: 200
};

export default function(args) {
  const [waveSurfer, setWaveSurfer] = useState(null);
  const [startLocation, setStartLocation] = useState(null);
  const [zoom, setZoom] = useState(50);
  const [speed, setSpeed] = useState(1);
  const [pitchShift, setPitchShift] = useState(0);
  const [timeline, setTimeLine] = useState(null);
  const [surferReady, setSurferReady] = useState(false);
  const playPressed = useKeyPress(" ");
  const beatPressed = useKeyPress("b");

  useEffect(() => {
    if (playPressed) {
      if (waveSurfer.isPlaying()) {
        waveSurfer.pause();
      } else {
        waveSurfer.play(startLocation);
      }
    }
  }, [playPressed, startLocation, waveSurfer]);

  useEffect(() => {
    if (waveSurfer == null) {
      let markers = [];
      let myTimeLine = MyTimeLine.create({
        container: "#timeline",
        markers
      });
      let waveSurferObject = WaveSurfer.create({
        container: "#waveform",
        waveColor: "violet",
        progressColor: "violet",
        fillParent: true,
        plugins: [myTimeLine]
      });

      let soundTouch = null;
      let source = null;
      waveSurferObject.on("ready", () => {
        soundTouch = new SoundTouch.SoundTouch(
          waveSurferObject.backend.ac.sampleRate
        );
        let buffer = waveSurferObject.backend.buffer;
        let channels = buffer.numberOfChannels;
        let l = buffer.getChannelData(0);
        let r = channels > 1 ? buffer.getChannelData(1) : l;
        let length = buffer.length;
        let seekingPos = null;
        let seekingDiff = 0;
        source = {
          extract: function(target, numFrames, position) {
            if (seekingPos != null) {
              seekingDiff = seekingPos - position;
              seekingPos = null;
            }

            position += seekingDiff;

            for (let i = 0; i < numFrames; i++) {
              target[i * 2] = l[i + position];
              target[i * 2 + 1] = r[i + position];
            }

            return Math.min(numFrames, length - position);
          }
        };

        let soundtouchNode;

        waveSurferObject.on("play", function(e) {
          console.log("play");

          seekingPos = ~~(
            waveSurferObject.backend.getPlayedPercents() * length
          );

          soundTouch.tempo = waveSurferObject.getPlaybackRate();

          let filter = new SoundTouch.SimpleFilter(source, soundTouch);
          console.log("pitchShift", pitchShift);
          if (pitchShift !== 0) {
            soundTouch.pitchSemitones(pitchShift);
            console.log("setting pitch to", pitchShift, "semitones");
          }

          soundtouchNode = SoundTouch.getWebAudioNode(
            waveSurferObject.backend.ac,
            filter
          );

          console.log("attaching soundtouch filter");
          waveSurferObject.backend.setFilter(soundtouchNode);
        });

        waveSurferObject.on("pause", function() {
          console.log("pause");
          soundtouchNode && soundtouchNode.disconnect();
        });

        waveSurferObject.on("seek", function(e, e1) {
          console.log("seek", waveSurferObject.getCurrentTime(), e, e1);
          setStartLocation(waveSurferObject.getCurrentTime());

          seekingPos = ~~(
            waveSurferObject.backend.getPlayedPercents() * length
          );
        });

        waveSurferObject.on("error", function(e) {
          console.warn(e);
          waveSurferObject.play();
        });

        setSurferReady(true);
      });
      waveSurferObject.load("sample.mp3");

      // document.getElementById("waveform").addEventListener("wheel", e => {
      //   e.stopPropagation();
      //   let newZoom = zoom + e.deltaY;
      //   if (newZoom < ZOOM_RANGE.min) newZoom = ZOOM_RANGE.min;
      //   if (newZoom > ZOOM_RANGE.max) newZoom = ZOOM_RANGE.max;
      //   setZoom(newZoom);
      // });
      setWaveSurfer(waveSurferObject);
      setTimeLine(myTimeLine);
    }
  }, []);

  useEffect(() => {
    if (waveSurfer) waveSurfer.zoom(zoom);
  }, [waveSurfer, zoom]);

  useEffect(() => {
    if (waveSurfer) waveSurfer.setPlaybackRate(speed);
  });

  useEffect(() => {
    if (beatPressed) {
      timeline.params.markers.push({
        when: waveSurfer.getCurrentTime(),
        type: "BEAT"
      });
      waveSurfer.zoom(zoom);
    }
  }, [beatPressed]);

  return (
    <div>
      {surferReady ? "" : <div>Loading...</div>}
      <div>
        <div id="timeline"></div>
        <div id="waveform"></div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <div>Position: {waveSurfer && waveSurfer.getCurrentTime()}</div>
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
              onChange={e => setPitchShift(e.target.value)}
              step={1}
              min={-12}
              max={12}
            />
          </div>
          <p>{pitchShift}</p>
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
  );
}

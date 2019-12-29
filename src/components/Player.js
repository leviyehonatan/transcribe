import Axios from 'axios';
import SoundTouch from '../processing/soundtouch';

export default class Player {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this._isPlaying = false;
        this._audioBuffer = null;
        this._detuneSemitones = 0;
        this._playbackSpeed = 1.0;
    }

    async load(src) {
        console.log('load class');
        const response = await Axios({
            method: 'get',
            url: src,
            responseType: 'arraybuffer',
        });
        this.audioBuffer = await this.audioContext.decodeAudioData(
            response.data,
        );
        this.initSoundTouch();
    }

    initSoundTouch() {
        this.soundTouch = new SoundTouch.SoundTouch(
            this.audioContext.sampleRate,
        );
        let l = this.audioBuffer.getChannelData(0);
        let r =
            this.audioBuffer.numberOfChannels > 1
                ? this.audioBuffer.getChannelData(1)
                : l;
        let length = this.audioBuffer.length;
        this.soundTouchSource = {
            extract: function(target, numFrames, position) {
                for (let i = 0; i < numFrames; i++) {
                    target[i * 2] = l[i + position];
                    target[i * 2 + 1] = r[i + position];
                }

                return Math.min(numFrames, length - position);
            },
        };
    }

    prepareFilter() {
        const {
            soundTouchSource,
            soundTouch,
            _playbackSpeed,
            _detuneSemitones,
        } = this;
        soundTouch.tempo = _playbackSpeed;
        soundTouch.pitchSemitones = _detuneSemitones;

        let soundTouchFilter = new SoundTouch.SimpleFilter(
            soundTouchSource,
            soundTouch,
        );
        soundTouchFilter.sourcePosition = ~~(
            (this.playStartPosition / this.audioBuffer.duration) *
            this.audioBuffer.length
        );

        console.log(this.soundTouchFilter);

        const BUFFER_SIZE = 1024;
        this.soundTouchNode = this.audioContext.createScriptProcessor(
            BUFFER_SIZE,
            2,
            2,
        );
        let samples = new Float32Array(BUFFER_SIZE * 2);
        this.soundTouchNode.onaudioprocess = function(e) {
            var l = e.outputBuffer.getChannelData(0);
            var r = e.outputBuffer.getChannelData(1);
            var framesExtracted = soundTouchFilter.extract(
                samples,
                BUFFER_SIZE,
            );
            if (framesExtracted === 0) {
                this.soundTouchNode && this.soundTouchNode.disconnect();
            }
            for (var i = 0; i < framesExtracted; i++) {
                l[i] = samples[i * 2];
                r[i] = samples[i * 2 + 1];
            }
        };
        this.soundTouchNode.connect(this.audioContext.destination);
    }

    play(playStartPosition) {
        console.log(playStartPosition);
        this.playStartPosition = playStartPosition;
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.buffer = this.audioBuffer;
        this.bufferSource.loop = true;
        if (this._detune !== 0 || this._playbackSpeed !== 1.0) {
            this.prepareFilter();
        } else {
            this.bufferSource.connect(this.audioContext.destination);
            this.bufferSource.start(0, playStartPosition);
        }
        this.playStartTime = this.audioContext.currentTime;
        this._isPlaying = true;
    }

    get isPlaying() {
        return this._isPlaying;
    }

    set isPlaying(value) {
        this._isPlaying = value;
    }

    get audioBuffer() {
        return this._audioBuffer;
    }

    set audioBuffer(value) {
        this._audioBuffer = value;
    }

    stop() {
        if (this.soundTouchNode) {
            this.soundTouchNode.disconnect();
            this.soundTouchNode = null;
        } else {
            this.bufferSource.stop();
        }
        this._isPlaying = false;
    }

    get position() {
        if (!this.isPlaying) return 0;
        const timeElapsed = this.audioContext.currentTime - this.playStartTime;
        return timeElapsed * this._playbackSpeed + this.playStartPosition;
    }

    restartPlayback() {
        const position = this.position;
        this.stop();
        this.play(position);
    }

    set detuneSemitones(value) {
        this._detuneSemitones = value;
        if (this.isPlaying) this.restartPlayback();
    }

    set playbackSpeed(value) {
        this._playbackSpeed = value;
        if (this.isPlaying) this.restartPlayback();
    }
}

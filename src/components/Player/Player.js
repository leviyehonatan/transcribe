import React from 'react';
import Axios from 'axios';

export default class Player {
    constructor() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContext();
        this._isPlaying = false;
        this._audioBuffer = null;
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
    }

    play(playStartPosition) {
        console.log(playStartPosition);
        this.bufferSource = this.audioContext.createBufferSource();
        this.bufferSource.buffer = this.audioBuffer;
        this.bufferSource.loop = true;
        this.bufferSource.connect(this.audioContext.destination);
        this.playStartTime = this.audioContext.currentTime;
        this.playStartPosition = playStartPosition;
        this.bufferSource.start(0, playStartPosition);
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
        this.bufferSource.stop();
        this._isPlaying = false;
    }

    get position() {
        if (!this.isPlaying) return 0;
        return (
            this.audioContext.currentTime -
            this.playStartTime +
            this.playStartPosition
        );
    }
}

import React from 'react';
import './App.css';
import Waveform from './components/Waveform/Waveform';

function App() {
    return (
        <div className="App">
            <div className="title">Transcribe</div>
            <Waveform src="sample.mp3" />{' '}
        </div>
    );
}

export default App;

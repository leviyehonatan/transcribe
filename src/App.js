import React from 'react';
import './App.css';
import Transcriber from './components/Transcriber';

function App() {
    return (
        <div className="App">
            <div className="title"></div>
            <Transcriber src="sample.mp3" />{' '}
        </div>
    );
}

export default App;

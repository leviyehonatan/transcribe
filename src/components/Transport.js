import React from 'react';
import PlaySettingsContext from './PlaySettingsContext';

function Button({ text }) {}
function Slider({ id, text, min, max, value, step, onChange }) {
    return (
        <div id={id}>
            <div>
                {text}
                <input
                    type="range"
                    value={value}
                    onChange={onChange()}
                    step={step}
                    min={min}
                    max={max}
                />
            </div>
            <p>{value}</p>
        </div>
    );
}

export default function Transport({ player }) {
    const playSettingsContext = useContext(PlaySettingsContext);
    const { detuneSemitones } = playSettingsContext;
    return (
        <div>
            <Button text="play/pause" />
            <Button text="facebook" />
            <Slider text="detune" min={=12} max={12} value={detuneSemitones} />
        </div>
    );
}

import { createContext } from 'react';

const initialSettings = {
    playSpeed: 1.0,
    detune: 0,
};

const PlaySettingsContext = createContext(initialSettings);

export default PlaySettingsContext;

import { useState, useEffect } from 'react';

export function useKeyPress(targetKey) {
    // State for keeping track of whether key is pressed
    const [keyPressed, setKeyPressed] = useState(false);

    const match = event =>
        Number.isInteger(targetKey)
            ? targetKey === event.keyCode
            : targetKey.toLowerCase() === event.key.toLowerCase();
    const onDown = event => {
        if (match(event)) setKeyPressed(true);
    };

    const onUp = event => {
        if (match(event)) setKeyPressed(false);
    };

    // Add event listeners
    useEffect(() => {
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        // Remove event listeners on cleanup
        return () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
        };
    }, [targetKey]); // Empty array ensures that effect is only run on mount and unmount

    return keyPressed;
}

export function useMultiKeyPress() {
    const [keysPressed, setKeyPressed] = useState(new Set([]));

    function downHandler({ key }) {
        setKeyPressed(keysPressed.add(key));
    }

    const upHandler = ({ key }) => {
        keysPressed.delete(key);
        setKeyPressed(keysPressed);
    };

    useEffect(() => {
        window.addEventListener('keydown', downHandler);
        window.addEventListener('keyup', upHandler);
        return () => {
            window.removeEventListener('keydown', downHandler);
            window.removeEventListener('keyup', upHandler);
        };
    }, []); // Empty array ensures that effect is only run on mount and unmount

    return keysPressed;
}

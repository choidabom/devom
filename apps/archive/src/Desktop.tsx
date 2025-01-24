import type { JSX } from 'react';
import { useDesktopMode } from './hooks/useDesktopMode';

const Desktop = (): JSX.Element => {
    const { desktopMode, toggleDesktopMode } = useDesktopMode();

    return (
        <div className="bg-light dark:bg-dark bg-cover w-screen h-screen">
            <button
                className="absolute right-5 top-5 p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700"
                aria-label={`Switch to ${desktopMode === 'light' ? 'dark' : 'light'} mode`}
                onClick={toggleDesktopMode}
            >
                {desktopMode === 'light' ? '🌞' : '🌙'}
            </button>
        </div>
    );
};

export default Desktop;

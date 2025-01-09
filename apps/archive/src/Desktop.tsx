import type { JSX } from 'react';
import AppWindow from './components/AppWindow';
import { useDesktopMode } from './hooks/useDesktopMode';

const Desktop = (): JSX.Element => {
    const { desktopMode, toggleDesktopMode } = useDesktopMode();

    return (
        <div className="h-screen w-screen bg-light bg-cover dark:bg-dark">
            <button
                className="absolute right-5 top-5 rounded-full bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label={`Switch to ${desktopMode === 'light' ? 'dark' : 'light'} mode`}
                onClick={toggleDesktopMode}
            >
                {desktopMode === 'light' ? '🌞' : '🌙'}
            </button>

            <AppWindow />
        </div>
    );
};

export default Desktop;

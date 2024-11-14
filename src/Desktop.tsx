import { useEffect, useState } from 'react';

const Desktop = (): JSX.Element => {
    const [desktopMode, setDesktopMode] = useState<'light' | 'dark'>('light');

    const toggleDesktopMode = (): void => {
        setDesktopMode(desktopMode === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        document.documentElement.classList.toggle('dark', desktopMode === 'dark');
    }, [desktopMode]);

    return (
        <div className="bg-light dark:bg-dark bg-cover w-screen h-screen">
            <button
                className="absolute right-5 top-5 p-2 rounded-full bg-gray-200 dark:bg-gray-800"
                onClick={toggleDesktopMode}
            >
                {desktopMode === 'light' ? '🌞' : '🌙'}
            </button>
        </div>
    );
};

export default Desktop;

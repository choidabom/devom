import { useEffect, useState } from 'react';

type DesktopMode = 'light' | 'dark';

export const useDesktopMode = (): {
    desktopMode: string;
    toggleDesktopMode: () => void;
} => {
    const [desktopMode, setDesktopMode] = useState<DesktopMode>('light');

    const toggleDesktopMode = (): void => {
        setDesktopMode((currentMode) => {
            const newMode: DesktopMode = currentMode === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', newMode);
            document.documentElement.classList.replace(currentMode, newMode);

            return newMode;
        });
    };

    useEffect(() => {
        const theme = localStorage.getItem('theme') as DesktopMode;
        const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const mode = theme || (preferDark ? 'dark' : 'light');
        document.documentElement.classList.add(mode);
        setDesktopMode(mode);

        return (): void => {
            document.documentElement.classList.remove('light', 'dark');
        };
    }, []);

    return { desktopMode, toggleDesktopMode };
};

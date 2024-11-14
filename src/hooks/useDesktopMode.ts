import { useEffect, useState } from 'react';

export const useDesktopMode = (): {
    desktopMode: string;
    toggleDesktopMode: () => void;
} => {
    const [desktopMode, setDesktopMode] = useState<'light' | 'dark'>('light');

    const toggleDesktopMode = (): void => {
        setDesktopMode(desktopMode === 'light' ? 'dark' : 'light');
    };

    useEffect(() => {
        document.documentElement.classList.toggle('dark', desktopMode === 'dark');

        return (): void => {
            document.documentElement.classList.remove('dark');
        };
    }, [desktopMode]);

    return { desktopMode, toggleDesktopMode };
};

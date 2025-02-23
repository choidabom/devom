import { useCallback, useState, type ReactNode } from 'react';
import type { Application } from '../types/types';
import { ApplicationContext } from './types';

let nextId = 0;

export const ApplicationProvider = ({ children }: { children: ReactNode }): ReactNode => {
    const [applications, setApplications] = useState<Application[]>([]);

    const addApplication = useCallback(
        (name: string, component: ReactNode, config: Omit<Application['config'], 'zIndex'>) => {
            const newApp: Application = {
                id: nextId++,
                name: name,
                component,
                config: {
                    ...config,
                    zIndex: nextId + 1,
                },
            };
            setApplications((prev) => [...prev, newApp]);
        },
        [],
    );

    const setZIndexToFront = useCallback((id: number) => {
        setApplications((prev) => {
            const maxZIndex = Math.max(...prev.map((app) => app.config.zIndex));
            return prev.map((app) =>
                app.id === id ? { ...app, config: { ...app.config, zIndex: maxZIndex + 1 } } : app,
            );
        });
    }, []);

    return (
        <ApplicationContext.Provider value={{ applications, addApplication, setZIndexToFront }}>
            {children}
        </ApplicationContext.Provider>
    );
};

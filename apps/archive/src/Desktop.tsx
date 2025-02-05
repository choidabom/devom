import { TodoList } from '@devom/todolist';
import { useState, type JSX } from 'react';
import ApplicationManager from './ApplicationManage';
import AppWindow from './components/appWindow/AppWindow';
import Blog from './components/application/Blog';
import { useDesktopMode } from './hooks/useDesktopMode';

const Desktop = (): JSX.Element => {
    const { desktopMode, toggleDesktopMode } = useDesktopMode();

    const [applicationManager] = useState(() => {
        const manager = new ApplicationManager();
        manager.addApplication('blog', <Blog />, {
            width: 800,
            height: 650,
            left: 70,
            top: 70,
            minWidth: 640,
            minHeight: 640,
        });
        manager.addApplication('todolist', <TodoList />, {
            width: 800,
            height: 650,
            left: 350,
            top: 100,
            minWidth: 500,
            minHeight: 640,
        });

        return manager;
    });
    const [applications, setApplications] = useState(applicationManager.getApplications());

    const handleZIndex = (id: number): void => {
        applicationManager.setZIndexToFront(id);
        setApplications(applicationManager.getApplications().slice());
    };

    return (
        <div className="h-screen w-screen bg-light bg-cover dark:bg-dark">
            <button
                className="absolute right-5 top-5 rounded-full bg-gray-200 p-2 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
                aria-label={`Switch to ${desktopMode === 'light' ? 'dark' : 'light'} mode`}
                onClick={toggleDesktopMode}
            >
                {desktopMode === 'light' ? '🌞' : '🌙'}
            </button>

            {applications.map((app) => (
                <AppWindow key={app.id} app={app} onZIndex={() => handleZIndex(app.id)} />
            ))}
        </div>
    );
};

export default Desktop;

import { useRef } from 'react';
import RnD from './RnD';

const AppWindow = (): JSX.Element => {
    const appWindowRef = useRef<HTMLDivElement>(null);

    return (
        <RnD ref={appWindowRef}>
            <div className="main-content h-screen flex-grow overflow-y-auto overflow-x-hidden bg-white">teset</div>;
        </RnD>
    );
};

export default AppWindow;

import { ApplicationProvider } from '../../context/ApplicationContext';
import { DesktopContent } from './DesktopContent';

export const Desktop = (): JSX.Element => {
    return (
        <ApplicationProvider>
            <DesktopContent />
        </ApplicationProvider>
    );
};

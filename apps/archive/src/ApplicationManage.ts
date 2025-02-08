import type { ReactNode } from 'react';
import type { AppRect } from './Application';
import Application from './Application';

class ApplicationManager {
    private applications: Application[];
    private nextZIndex: number;

    constructor() {
        this.applications = [];
        this.nextZIndex = 1;
    }

    addApplication(appName: string, content?: ReactNode, appRect?: AppRect): Application {
        const newApplication = new Application(
            this.applications.length + 1,
            appName,
            this.nextZIndex,
            content,
            appRect,
        );
        this.nextZIndex += 1;
        this.applications.push(newApplication);
        return newApplication;
    }

    getApplications(): Application[] {
        return this.applications;
    }

    setZIndexToFront(id: number): void {
        const application = this.applications.find((app) => app.id === id);

        // nextZIndex는 현재 가장 높은 zIndex보다 1 높은 값
        // 클릭한 App이 이미 가장 높은 zIndex를 가지고 있다면 nextZIndex로 세팅할 필요 x
        if (application && application.zIndex === this.nextZIndex - 1) {
            return;
        }

        if (application) {
            application.setZIndex(this.nextZIndex);
            this.nextZIndex += 1;
        }
    }
}

export default ApplicationManager;

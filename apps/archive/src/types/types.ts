export interface Application {
    id: number;
    name: string;
    component: React.ReactNode;
    config: {
        width: number;
        height: number;
        left: number;
        top: number;
        minWidth?: number;
        minHeight?: number;
        disableResizeControl?: boolean;
        zIndex: number;
    };
}

interface RnDProps {
    ref: React.RefObject<HTMLDivElement>;
    children: React.ReactNode;
}

// RnD: Resizable and Draggable (react-rnd)
const RnD = (props: RnDProps): JSX.Element => {
    const { ref, children } = props;

    return (
        <div ref={ref} className="flex flex-col overflow-hidden rounded-lg shadow-lg shadow-black/30">
            {children}
        </div>
    );
};

export default RnD;

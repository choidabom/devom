import type { JSX } from "react";

interface MoreOptionsIconProps {
  onClick: () => void;
}
const MoreOptionsIcon = (props: MoreOptionsIconProps): JSX.Element => {
  const { onClick } = props;

  return (
    <button className="flex space-x-0.5" onClick={onClick}>
      <div className="h-1 w-1 rounded-full bg-gray-400"></div>
      <div className="h-1 w-1 rounded-full bg-gray-400"></div>
      <div className="h-1 w-1 rounded-full bg-gray-400"></div>
    </button>
  );
};

export default MoreOptionsIcon;

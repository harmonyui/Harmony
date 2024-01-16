import { getClass } from "../../../src/utils/util";
import { XMarkIcon } from "./icons";

export interface ClosableContentProps {
  onClose: () => void;
  children: React.ReactNode;
	className?: string;
}
export const ClosableContent: React.FunctionComponent<ClosableContentProps> = ({
  onClose,
  children,
	className
}) => {
  return (
    <div className={getClass('relative',className)}>
      <div className="absolute top-0 right-0">
        <button className="hover:opacity-50" onClick={onClose} type="button">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      {children}
    </div>
  );
};

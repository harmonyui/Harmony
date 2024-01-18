import { getClass } from "../../../../util/src/index";
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
    <div className={getClass('hw-relative',className)}>
      <div className="hw-absolute hw-top-0 hw-right-0">
        <button className="hover:hw-opacity-50" onClick={onClose} type="button">
          <XMarkIcon className="hw-w-6 hw-h-6" />
        </button>
      </div>
      {children}
    </div>
  );
};

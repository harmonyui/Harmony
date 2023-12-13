import { XMarkIcon } from "./icons";

export interface ClosableContentProps {
  onClose: () => void;
  children: React.ReactNode;
	className: string | undefined;
}
export const ClosableContent: React.FunctionComponent<ClosableContentProps> = ({
  onClose,
  children,
	className
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-0 right-0">
        <button className="hover:opacity-50" onClick={onClose} type="button">
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      {children}
    </div>
  );
};

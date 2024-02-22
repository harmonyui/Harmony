import { ChevronDownIcon, ChevronUpIcon } from "./icons";

export interface ChevronSwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  className?: string;
}
export const ChevronSwitch: React.FunctionComponent<ChevronSwitchProps> = ({
  value,
  onChange,
  label,
  className,
}) => {
  const Icon = value ? ChevronUpIcon : ChevronDownIcon;
  return (
    <button
      className={`${className} hw-flex hw-items-center hover:hw-bg-gray-200 hw-rounded-md hw-px-2 hw-py-1 hw-font-semibold`}
      onClick={() => {
        onChange(!value);
      }}
      type="button"
    >
      {label}
      <Icon className="hw-w-3 hw-h-3 hw-ml-1" />
    </button>
  );
};

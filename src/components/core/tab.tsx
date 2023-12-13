import { useState } from "react";
import { getClass } from "../../utils/util";

const useTabSelect = (items: TabItem[]) => {
	const [selected, setSelected] = useState<string | number>(items[0]?.id ?? -1);

  const selectedComponent = items.find((item) => item.id === selected)
    ?.component;
  if (!selectedComponent) {
    throw new Error(`Could not find tab component with id ${selected}`);
  }

  const onTabSelect = (id: string | number): void => {
    setSelected(id);
  };

	return {
		selectedItem: selected,
		selectedComponent,
		onTabSelect
	}
}

export interface TabItem {
  label: string;
  component: React.ReactElement;
  id: string | number;
	notification?: NotificationDotColor
}

interface TabControlProps {
  items: TabItem[];
  className?: string;
}
export const TabControl: React.FunctionComponent<TabControlProps> = ({
  items,
  className,
}) => {
  const {selectedItem, selectedComponent, onTabSelect} = useTabSelect(items);

  return (
    <div className={className}>
      <div className="text-sm font-medium text-center border-b border-gray-200 dark:text-gray-400 dark:border-gray-700">
        <ul className="flex flex-wrap -mb-px font-semibold text-2xl">
          {items.map((item, i) => (
            <li className="mr-2" key={i}>
							<NotificationDot color={item.notification}>
								<button
									className={getClass(
										"inline-block px-4 py-2 border-b-2 rounded-t-lg outline-none",
										selectedItem === item.id
											? "border-b-4 border-primary rounded-t-lg active dark:text-primary-light dark:border-primary-light"
											: "border-transparent hover:border-gray-300 dark:hover:text-gray-300",
									)}
									onClick={() => {
										onTabSelect(item.id);
									}}
									type="button"
								>
									{item.label}
								</button>
							</NotificationDot>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 mx-2">{selectedComponent}</div>
    </div>
  );
};

type NotificationDotColor = 'gray' | 'red' | 'green'
export interface NotificationDotProps {
	children: React.ReactNode,
	color: NotificationDotColor | undefined
}
export const NotificationDot: React.FunctionComponent<NotificationDotProps> = ({children, color}) => {
	if (color === undefined) {
		return <>{children}</>;
	}

	const colors: Record<NotificationDotColor, string> = {
		'gray': 'bg-gray-300',
		'red': 'bg-red-400',
		'green': 'bg-green-400'
	}

	const dotColor = colors[color];

	return (
		<span className="relative">
			{children}
			<span className={`absolute right-0 top-0 block h-1.5 w-1.5 rounded-full ${dotColor} ring-2 ring-white`} />
		</span>
	)
}

export const TabButton: React.FunctionComponent<TabControlProps> = ({items, className}) => {
	const {selectedItem, selectedComponent, onTabSelect} = useTabSelect(items);

	return (
		<div className={className}>
			<ul className={getClass('inline-flex gap-2 border rounded-md p-1 bg-gray-100 items-center')}>
				{items.map(item => <li key={item.id}>
					<button onClick={() => onTabSelect(item.id)} className={getClass('py-1 px-2 rounded-md', item.id === selectedItem ? 'bg-white shadow-sm hover:bg-gray-50' : 'hover:bg-gray-200 hover:shadow-sm')}>{item.label}</button>
				</li>)}
			</ul>
			<div className="mt-2">{selectedComponent}</div>
		</div>
	)
}

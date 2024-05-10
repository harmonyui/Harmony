import { getClass } from "@harmony/util/src/utils/common";
import { useState } from "react";

export interface TreeViewItem<T = string> {
	id: T;
	content: React.ReactNode,
	items: TreeViewItem<T>[],
	selected: boolean,
}
const isSelected = <T,>(item: TreeViewItem<T>): boolean => {
	if (item.selected) return true;

	if (item.items.some(it => isSelected(it))) return true;

	return false;
}

export const TreeViewItem = <T,>({item, onClick, onHover}: {item: TreeViewItem<T>, onClick: (item: TreeViewItem<T>) => void, onHover: (item: TreeViewItem<T>) => void,}) => {
	const [expand, setExpand] = useState(isSelected(item));
	const onExpand = () => {
		setExpand(!expand);
	}

	return (<>
		{item.items.length === 0 ? <li className={getClass("hw-px-2 hover:hw-bg-gray-100", item.selected ? 'hw-bg-gray-200' : '')}>
			<button onClick={() => {onClick(item)}} onMouseOver={() => {onHover(item)}}>{item.content}</button></li> : null}
			{item.items.length > 0 ? <li className={getClass(item.selected ? "hw-bg-gray-200" : "")}>
				<div className="hw-flex">
				<button
					onClick={onExpand}
					role="button"
					aria-expanded="false"
					aria-controls="collapseThree"
					className="hw-flex hw-items-center hw-px-1 hover:hw-bg-gray-100 hw-rounded-md focus:hw-text-primary active:hw-text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="2.5"
						stroke="currentColor"
						className={getClass('hw-h-4 hw-w-4', expand ? 'rotate-90' : '')}>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
				</button>
				<button className="hw-px-1 hover:hw-bg-gray-100 hw-rounded-md" onClick={() => {onClick(item)}} onMouseOver={() => {onHover(item)}}>
					{item.content}
				</button>
				</div>
				<TreeView items={item.items} expand={expand} onClick={onClick} onHover={onHover}/>
			</li> : null}
		</>
	)
}

export const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<T>[], expand?: boolean, onClick: (item: TreeViewItem<T>) => void, onHover: (item: TreeViewItem<T>) => void}) => {
	return <>
		<ul className={getClass('!hw-visible hw-ml-2', expand ? '' : 'hw-hidden')}>
			{items.map(item => <>
				<TreeViewItem item={item} onClick={onClick} onHover={onHover}/>
			</>)}
		</ul>
	</>
}
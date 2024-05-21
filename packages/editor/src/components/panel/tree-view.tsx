import { getClass } from "@harmony/util/src/utils/common";
import { useEffect, useState } from "react";
import { set } from "zod";
import {
	ContextMenuComponent,
	TreeViewComponent,
  } from "@syncfusion/ej2-react-navigations";
  import { enableRipple } from "@syncfusion/ej2-base";
  enableRipple(true);
  let menuObj;
  let treeObj;
export interface TreeViewItem<T = string> {
	id: T;
	content: React.ReactNode,
	items: TreeViewItem<T>[],
	selected: boolean,
}

export interface TransformNode<T = string> {
	id: T,
	type: React.ReactNode,
	subChild: TransformNode<T>[],
	expanded: boolean,
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
	const  [transformedItems, setTransformedItems] = useState<TransformNode<T>[]>(); 
	
	function transform(node: TreeViewItem<any>): TransformNode<T> {
		const {id} = node.id;
		
		const transformedNode: TransformNode<T> = {
			id,
			type: String(node.content), // Ensuring content is cast to string
			expanded: false,
			subChild: [] as TransformNode<T>[],
		};
	
		if (node.items && node.items.length > 0) {
			transformedNode.subChild = node.items.map(transform);
		}
	
		return transformedNode;
	}

	useEffect(() => {
		let i = items.map((item) => {
			return transform(item)
		})
        i[0].expanded = true
		setTransformedItems(i);
	}, [items])

	useEffect(() => {
		console.log(transformedItems)
	}, [transformedItems])


	function nodeclicked(args: any) {
		console.log(args.node.data)
    }
    const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild' };

    if (!transformedItems) return <p>loading....</p>;

    return (
        // specifies the tag for render the TreeView component
        <TreeViewComponent fields={fields} allowDragAndDrop={true} nodeClicked={nodeclicked.bind(this)} />
    );
}
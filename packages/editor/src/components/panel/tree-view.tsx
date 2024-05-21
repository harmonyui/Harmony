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


export const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<T>[], expand?: boolean, onClick: (item: HTMLElement) => void, onHover: (item: HTMLElement) => void}) => {
	const  [transformedItems, setTransformedItems] = useState<TransformNode<T>[]>(); 
	
	function transform(node: TreeViewItem<any>): TransformNode<T> {
		const {id, name} = node.id;
		
		const transformedNode: TransformNode<T> = {
			id,
			type: String(name), 
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

	function nodeclicked(args: any) {
		const v = [args.node.getAttribute("data-uid")];
		const node = document.querySelectorAll(`[data-harmony-id="${v}"]`)
		onClick(node[0] as HTMLElement)
    }	
	
    if (!transformedItems) return <p>loading....</p>;
	
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild', node: "node"};
    return (
        // specifies the tag for render the TreeView component
        <TreeViewComponent fields={fields} allowDragAndDrop={true} nodeClicked={nodeclicked.bind(this)}  />
    );
}
import { getClass } from "@harmony/util/src/utils/common";
import { useEffect, useState } from "react";
import { set } from "zod";
import {
	ContextMenuComponent,
	TreeViewComponent,
  } from "@syncfusion/ej2-react-navigations";
  import { enableRipple } from "@syncfusion/ej2-base";
import { useHarmonyContext } from "../harmony-context";
import { findElementFromId } from "../harmony-provider";
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
	childIdx: number,
}


const isSelected = <T,>(item: TreeViewItem<T>): boolean => {
	if (item.selected) return true;

	if (item.items.some(it => isSelected(it))) return true;

	return false;
}


export const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<T>[], expand?: boolean, onClick: (item: HTMLElement) => void, onHover: (item: HTMLElement) => void}) => {
	const  [transformedItems, setTransformedItems] = useState<TransformNode<T>[]>(); 
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild'};
	
	function transform(node: TreeViewItem<any>): TransformNode<T> {
		const {id, name} = node.id;
		
		const transformedNode: TransformNode<T> = {
			id,
			type: String(name), 
			expanded: false,
			subChild: [] as TransformNode<T>[],
			childIdx: 0,
		};
	
		if (node.items && node.items.length > 0) {
			let children = node.items.map(transform);
			transformedNode.subChild = children.map((child, index) => {
				child.childIdx = index;
				return child;
			});
		}
	
		return transformedNode;
	}

	useEffect(() => {
		let i = items.map((item) => {
			return transform(item)
		})
        i[0].expanded = true
		setTransformedItems(i);
	}, [])
	
	return (
        // specifies the tag for render the TreeView component
        <TreeViewComponent fields={fields} allowDragAndDrop={true} ref={(treeview) => { treeObj = treeview; }} nodeTemplate={TreeViewItem} />
    );
}

export interface TreeViewRenderItem {
	id: string;
	type: string;
	childIdx: number;
}

function TreeViewItem(data: TreeViewRenderItem) {
	const {onComponentSelect, onComponentHover} = useHarmonyContext()

	function handleHover() {
		const element = findElementFromId(data.id, data.childIdx)
		if (element) {
			onComponentHover(element)
		}
	}

	function nodeclicked(args: any) {
		const element = findElementFromId(data.id, data.childIdx)
		if (element) {
			onComponentSelect(element)
		}
    }	

	return (
		<div onMouseEnter={handleHover} onClick={nodeclicked} >
			{data.type}
		</div>
	)
}
import { getClass } from "@harmony/util/src/utils/common";
import { useEffect, useState } from "react";
import { set } from "zod";
import {
	ContextMenuComponent,
	TreeViewComponent,
  } from "@syncfusion/ej2-react-navigations";
  import { enableRipple } from "@syncfusion/ej2-base";
import { ComponentUpdateWithoutGlobal, useHarmonyContext } from "../harmony-context";
import { findElementFromId } from "../harmony-provider";
import { v4 as uuidv4 } from 'uuid';
  enableRipple(true);
  
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
	childIndex: number,
	uid: string
}



let menuObj;
let treeObj: TreeViewComponent | null;
const isSelected = <T,>(item: TreeViewItem<T>): boolean => {
	if (item.selected) return true;

	if (item.items.some(it => isSelected(it))) return true;

	return false;
}


export const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<T>[], expand?: boolean, onClick: (item: HTMLElement) => void, onHover: (item: HTMLElement) => void}) => {
	const { onAttributesChange, onComponentHover, onComponentSelect } = useHarmonyContext()
	
	const  [transformedItems, setTransformedItems] = useState<TransformNode<T>[]>(); 
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild', childIndex: 'childIndex'};
	
	function transform(node: TreeViewItem<any>): TransformNode<T> {
		const {id, name} = node.id;
		
		const transformedNode: TransformNode<T> = {
			id,
			type: String(name), 
			expanded: true,
			subChild: [] as TransformNode<T>[],
			childIndex: 0,
			uid: uuidv4()
		};
	
		if (node.items && node.items.length > 0) {
			let children = node.items.map(node => transform(node));
			transformedNode.subChild = children.map((child, index) => {
				child.childIndex = index;
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

	function handleNodeDropped(event: any) {
		const { draggedParentNode: oldParent, dropTarget: newParent, dropIndex: newIndex, droppedNode, draggedNode, droppedNodeData: node } = event;
		const childIdx = draggedNode.children[1].children[1].children[0].getAttribute('data-child')

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "reorder",
			action: 'change',
			componentId: droppedNode.dataset.uid,
			childIndex: newIndex,
			oldValue: JSON.stringify({parentId: oldParent.dataset.uid, childIndex: childIdx}),
			value: JSON.stringify({parentId: newParent.dataset.uid, childIndex: newIndex})
		}
		onAttributesChange([update])
		droppedNode.children[1].children[1].children[0].dataset.child = childIdx
		draggedNode.children[1].children[1].children[0].dataset.child = newIndex
	}

	function onMouseOver(item: HTMLElement, uid: string) {
		const childIdx = document.querySelector(`[data-uid="${uid}"]`)?.getAttribute('data-child')
		const element = findElementFromId(item.dataset.uid!!, parseInt(childIdx!))
		if (element) {
			onComponentHover(element)
		}
	}
	function onMouseClick(item: HTMLElement, uid: string) {
		const childIdx = document.querySelector(`[data-uid="${uid}"]`)?.getAttribute('data-child')
		const element = findElementFromId(item.dataset.uid!!,  parseInt(childIdx!))
		if (element) {
			onComponentSelect(element)
		}
	}

	function addEvents(tree: HTMLElement[]) {
		tree.forEach((item, idx )=> {
			if (item.dataset.uid) {
				if (item.children[0] && item.children[0].classList.contains('e-fullrow') && item.children[1].innerHTML.includes('data-uid')) {
					const uid = item.children[1].innerHTML.split('data-uid=')[1].split('"')[1]
					item.children[0].addEventListener('mouseover', () => {
						onMouseOver(item, uid!)
						onMouseClick(item, uid!)
					})
					item.children[1].addEventListener('mouseover', () => {
						onMouseOver(item, uid!)
						onMouseClick(item, uid!)
					})
				}
			}
			addEvents(Array.from(item.children) as HTMLElement[])
		})
	}

	function onCreated() {
		if (treeObj) {
			addEvents([treeObj.element])
		}
	}
	
	return (
        <TreeViewComponent fields={fields} allowDragAndDrop={true} ref={(treeview) => { treeObj = treeview; }} nodeDropped={handleNodeDropped} nodeTemplate={TreeViewItem} created={onCreated} />
    );
}

export interface TreeViewRenderItem {
	id: string;
	type: string;
	childIndex: number;
	uid: string;
}

function TreeViewItem(data: TreeViewRenderItem) {
	return (
		<div data-uid={data.uid} data-child={data.childIndex}>
			{data.type}
		</div>
	)
}
import { getClass } from "@harmony/util/src/utils/common";
import { useEffect, useState } from "react";
import { set } from "zod";
import {
	ContextMenuComponent,
	DragAndDropEventArgs,
	TreeViewComponent,
  } from "@syncfusion/ej2-react-navigations";
  import { enableRipple } from "@syncfusion/ej2-base";
import { ComponentUpdateWithoutGlobal, useHarmonyContext } from "../harmony-context";
import { findElementFromId } from "../harmony-provider";
import { v4 as uuidv4 } from 'uuid';
import { ComponentElement } from "../inspector/component-identifier";
  enableRipple(true);
  
export interface TreeViewItem<T = string> {
	id: T;
	content: React.ReactNode,
	items: TreeViewItem<T>[],
	selected: boolean,
}

export interface TransformNode {
	id: string,
	type: React.ReactNode,
	subChild: TransformNode[],
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


export const TreeView = <T,>({items, expand, onClick, onHover}: {items: TreeViewItem<ComponentElement>[], expand?: boolean, onClick: (item: HTMLElement) => void, onHover: (item: HTMLElement) => void}) => {
	const { onAttributesChange, onComponentHover, onComponentSelect, setError } = useHarmonyContext()
	
	const  [transformedItems, setTransformedItems] = useState<TransformNode[]>(); 
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild', childIndex: 'childIndex'};
	
	function transform(node: TreeViewItem<any>): TransformNode {
		const {id, name} = node.id;
		
		const transformedNode: TransformNode = {
			id,
			type: String(name), 
			expanded: true,
			subChild: [] as TransformNode[],
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

	function handleNodeDropped(event: DragAndDropEventArgs) {
		const { draggedParentNode: oldParentElement, dropTarget: newParentElement, dropIndex: newIndex, droppedNode, draggedNode, droppedNodeData: node } = event;
		const childIdx = draggedNode.children[1].innerHTML.split("data-child=")[1].split('"')[1] as string
		const componentId = draggedNode.children[1].innerHTML.split("data-node=")[1].split('"')[1] as string

		const oldParent = oldParentElement as HTMLElement
		const newParent = newParentElement as HTMLElement

		if (oldParent.dataset.uid != newParent.dataset.uid) {
			event.cancel = true
			setError("Cannot move component to a different file")
			return;
		}

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "reorder",
			action: 'change',
			componentId: componentId,
			childIndex: parseInt(childIdx),
			oldValue: JSON.stringify({parentId: oldParent.dataset.uid, childIndex: parseInt(childIdx)}),
			value: JSON.stringify({parentId: newParent.dataset.uid, childIndex: newIndex})
		}
		onAttributesChange([update])

		function updateChildIndex(parent: Element) {
			const children = Array.from(parent.children) as HTMLElement[]
			children[2].childNodes.forEach((child, idx) => {
				const c = child.childNodes[1] as HTMLElement
				const uid = c.innerHTML.split("data-uid=")[1].split('"')[1] as string
				if (uid) {
					const e = document.querySelector(`[data-uid="${uid}"]`) 
					e?.setAttribute('data-child', idx.toString())
				}
			})
		}

		if (oldParent.dataset.uid === newParent.dataset.uid) {
			updateChildIndex(newParent)
		} else {
			updateChildIndex(oldParent)
			updateChildIndex(newParent)
		
		}
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
					})
					item.children[0].addEventListener('click', () => {
						onMouseClick(item, uid!)
					})
					
					item.children[1].addEventListener('mouseover', () => {
						onMouseOver(item, uid!)
					})
					item.children[1].addEventListener('click', () => {
						onMouseClick(item, uid!)
					})
				}
			}
			addEvents(Array.from(item.children) as HTMLElement[])
		})
	}

	function dragStop(event: DragAndDropEventArgs) {
		const { draggedParentNode: oldParentElement, dropTarget: newParentElement, } = event;

		const oldParent = oldParentElement as HTMLElement
		const newParent = newParentElement as HTMLElement

		if (oldParent?.dataset?.uid == newParent?.dataset?.uid) return;

		event.cancel = true;
	}

	function nodeDrag(event: DragAndDropEventArgs) {
		const { draggedParentNode: oldParentElement, dropTarget: newParentElement, } = event;

		const oldParent = oldParentElement as HTMLElement
		const newParent = newParentElement as HTMLElement

		if (oldParent?.dataset?.uid == newParent?.dataset?.uid) return;

		event.dropIndicator = 'e-no-drop';
	}

	function onCreated() {
		if (treeObj) {
			addEvents([treeObj.element])
		}
	}
	
	return (
        <TreeViewComponent fields={fields} allowDragAndDrop={true} nodeDragging={nodeDrag.bind(this)} nodeDragStop={dragStop.bind(this)} ref={(treeview) => { treeObj = treeview; }} nodeDropped={handleNodeDropped} nodeTemplate={TreeViewItem} created={onCreated} />
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
		<div data-uid={data.uid} data-child={data.childIndex} data-node={data.id}>
			{data.type}
		</div>
	)
}
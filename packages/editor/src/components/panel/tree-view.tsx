import { ComponentElement } from "@harmony/util/src/types/component";
import { enableRipple } from "@syncfusion/ej2-base";
import {
	DragAndDropEventArgs,
	TreeViewComponent
} from "@syncfusion/ej2-react-navigations";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { ComponentUpdateWithoutGlobal, useHarmonyContext } from "../harmony-context";
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
	error: string,
	component: string,
}



let menuObj;
let treeObj: TreeViewComponent | null;
const isSelected = <T,>(item: TreeViewItem<T>): boolean => {
	if (item.selected) return true;

	if (item.items.some(it => isSelected(it))) return true;

	return false;
}


export const TreeView = <T,>({ items, expand, onClick, onHover }: { items: TreeViewItem<ComponentElement>[], expand?: boolean, onClick: (item: HTMLElement) => void, onHover: (item: HTMLElement) => void }) => {
	const { onAttributesChange, onComponentHover, onComponentSelect, setError } = useHarmonyContext()

	const [transformedItems, setTransformedItems] = useState<TransformNode[]>();
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild', childIndex: 'childIndex' };

	function transform(node: TreeViewItem<any>, componentError = ''): TransformNode {
		const { id, name, element }: { id: string, name: string, element: HTMLElement } = node.id;
		const uuid = uuidv4();
		element.dataset.link = uuid
		const transformedNode: TransformNode = {
			id: uuid,
			type: String(name),
			expanded: true,
			subChild: [] as TransformNode[],
			childIndex: 0,
			error: componentError.length > 0 ? componentError : node.id.element.dataset.harmonyError,
			component: id
		};

		if (node.items && node.items.length > 0) {
			if (node.id.element.dataset.harmonyError === "component") {
				componentError = 'component'
			}
			let children = node.items.map(node => transform(node, componentError));
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
		const componentId = draggedNode.children[1].innerHTML.split('data-component=')[1].split('"')[1]
		const link = draggedNode.children[1].innerHTML.split("data-node=")[1].split('"')[1] as string
		const domNode = document.querySelector(`[data-link="${link}"]`) as HTMLElement
		
		const oldParent = oldParentElement as HTMLElement
		const oldParentId = oldParent.children[1].innerHTML.split('data-component=')[1].split('"')[1]
		const newParent = newParentElement as HTMLElement
		const newParentId = newParent.children[1].innerHTML.split('data-component=')[1].split('"')[1]
		
		const oldChildIndex = Array.from(domNode.parentElement!!.childNodes).indexOf(domNode)
		
		if (newParent.dataset.harmonyError === "component" || droppedNode.dataset.harmonyError === "component") {
			event.cancel = true
			setError("Cannot move the current component")
			return;
		}

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "reorder",
			action: 'change',
			componentId,
			childIndex: oldChildIndex,
			oldValue: JSON.stringify({ parentId: oldParentId, childIndex: oldChildIndex }),
			value: JSON.stringify({ parentId: newParentId, childIndex: newIndex })
		}
		onAttributesChange([update])
	}

	function onMouseOver(item: HTMLElement, link: string) {
		const node = document.querySelector(`[data-link="${link}"]`)
		if (node) {
			onComponentHover(node as HTMLElement)
		}
	}
	function onMouseClick(item: HTMLElement, link: string) {
		const node = document.querySelector(`[data-link="${link}"]`)
		if (node) {
			onComponentSelect(node as HTMLElement)
		}
	}

	function addEvents(tree: HTMLElement[]) {
		tree.forEach((item, idx) => {
			if (item.dataset.uid) {
				if (item.children[0] && item.children[0].classList.contains('e-fullrow') && item.children[1].innerHTML.includes('data-node')) {
					const link = item.children[1].innerHTML.split('data-node=')[1].split('"')[1]
					item.dataset.harmonyError = item.children[1].innerHTML.split('harmony-error=')[1].split('"')[1]
					item.children[0].addEventListener('mouseover', () => {
						onMouseOver(item, link!)
					})
					item.children[0].addEventListener('click', () => {
						onMouseClick(item, link!)
					})

					item.children[1].addEventListener('mouseover', () => {
						onMouseOver(item, link!)
					})
					item.children[1].addEventListener('click', () => {
						onMouseClick(item, link!)
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

		if (oldParent?.dataset.harmonyError === "component" || newParent?.dataset.harmonyError === "component") {
			event.cancel = true;
			event.dropIndicator = 'e-no-drop';
			setError("This component cannot be moved into this location")
			return;
		}
	}

	function nodeDragStart(event: DragAndDropEventArgs) {
		const { draggedNode } = event;

		if (draggedNode?.dataset.harmonyError === "component") {
			event.cancel = true;
			event.dropIndicator = 'e-no-drop';
			setError("This component cannot be moved!")
		}
	}

	function onCreated() {
		if (treeObj) {
			addEvents([treeObj.element])
		}
	}

	return (
		<TreeViewComponent fields={fields} allowDragAndDrop={true} nodeDragStart={nodeDragStart.bind(this)} nodeDragStop={dragStop.bind(this)} ref={(treeview) => { treeObj = treeview; }} nodeDropped={handleNodeDropped} nodeTemplate={TreeViewItem} created={onCreated} />
	);
}


function TreeViewItem(data: TransformNode) {
	return (
		<div data-child={data.childIndex} data-node={data.id} harmony-error={data.error || "none"} data-component={data.component}>
			<p>
				{data.error === "component" ? <span style={{ color: 'red' }}>⚠️</span> : ''}
				{data.type}
			</p>
		</div>
	)
}
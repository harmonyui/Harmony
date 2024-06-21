/* eslint-disable @typescript-eslint/dot-notation -- ok*/
import { enableRipple } from "@syncfusion/ej2-base";
import type {
	DragAndDropEventArgs,
	NodeSelectEventArgs,
	DrawNodeEventArgs} from "@syncfusion/ej2-react-navigations";
import {
	TreeViewComponent
} from "@syncfusion/ej2-react-navigations";
import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@harmony/ui/src/components/core/button";
import type { ComponentUpdateWithoutGlobal} from "../harmony-context";
import { useHarmonyContext } from "../harmony-context";
import type { ComponentElement } from "../inspector/component-identifier";
import type { ImageType } from "./add-image-panel";
import { AddImagePanel } from "./add-image-panel";

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
	const { onAttributesChange, onComponentHover, onComponentSelect, setError, selectedComponent } = useHarmonyContext()
	const [multiSelect, setMultiSelect] = useState<{ start: HTMLElement, end: HTMLElement }>()
	const [isImageOpen, setIsImageOpen] = useState(false);

	const [transformedItems, setTransformedItems] = useState<TransformNode[]>();
	const fields: Object = { dataSource: transformedItems, id: 'id', text: 'type', child: 'subChild', childIndex: 'childIndex', selected: 'isSelected' };

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
			const children = node.items.map(node => transform(node, componentError));
			transformedNode.subChild = children.map((child, index) => {
				child.childIndex = index;
				return child;
			});
		}

		return transformedNode;
	}

	useEffect(() => {
		const i = items.map((item) => {
			return transform(item)
		})
		i[0].expanded = true
		setTransformedItems(i);
	}, [items])

	function handleNodeDropped(event: DragAndDropEventArgs) {
		const { draggedParentNode: oldParentElement, dropTarget: newParentElement, dropIndex: newIndex, droppedNode, draggedNode, droppedNodeData: node } = event;
		const componentId = draggedNode.children[1].innerHTML.split('data-component=')[1].split('"')[1]
		const link = draggedNode.children[1].innerHTML.split("data-node=")[1].split('"')[1]
		const domNode = document.querySelector(`[data-link="${link}"]`)!

		const oldParent = oldParentElement as HTMLElement
		const oldParentId = oldParent.children[1].innerHTML.split('data-component=')[1].split('"')[1]
		const newParent = newParentElement as HTMLElement
		const newParentId = newParent.children[1].innerHTML.split('data-component=')[1].split('"')[1]

		const oldChildIndex = Array.from(domNode.parentElement!.childNodes).indexOf(domNode)

		if (newParent.dataset.harmonyError === "component" || droppedNode.dataset.harmonyError === "component") {
			event.cancel = true
			setError("Cannot move the current component")
			return;
		}

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "reorder",
			componentId,
			childIndex: oldChildIndex,
			oldValue: JSON.stringify({ parentId: oldParentId, childIndex: oldChildIndex }),
			value: JSON.stringify({ parentId: newParentId, childIndex: newIndex })
		}
		onAttributesChange([update])
	}

	function onMouseOver(link: string) {
		const node = document.querySelector(`[data-link="${link}"]`)
		if (node) {
			onComponentHover(node as HTMLElement)
		}
	}
	function onMouseClick(link: string) {
		const node = document.querySelector(`[data-link="${link}"]`)
		if (node) {
			onComponentSelect(node as HTMLElement)
		}
	}

	function dragStop(event: DragAndDropEventArgs) {
		const { draggedParentNode: oldParentElement, dropTarget: newParentElement, } = event;

		const oldParent = oldParentElement as HTMLElement
		const newParent = newParentElement as HTMLElement

		if (oldParent.dataset.harmonyError === "component" || newParent.dataset.harmonyError === "component") {
			event.cancel = true;
			event.dropIndicator = 'e-no-drop';
			setError("This component cannot be moved into this location")
			
		}
	}

	function nodeDragStart(event: DragAndDropEventArgs) {
		const { draggedNode } = event;

		if (draggedNode.dataset.harmonyError === "component") {
			event.cancel = true;
			event.dropIndicator = 'e-no-drop';
			setError("This component cannot be moved!")
		}
	}

	function drawNode(event: DrawNodeEventArgs) {
		event.node.addEventListener('mouseover', (e) => {
			e.stopPropagation();
			onMouseOver(event.nodeData.id as string);
		})

		event.node.addEventListener('click', (e) => {
			e.stopPropagation();
			onMouseClick(event.nodeData.id as string);
		})
	}


	function handleAddDeleteElement(action: "delete" | "create", position: "above" | "below" | "" = "") {
		if (!selectedComponent) return;
		const link = selectedComponent.dataset.link
		const component = document.querySelector(`[data-link="${link}"]`)!
		const childIndex = Array.from(component.parentElement!.childNodes).indexOf(selectedComponent)

		const cacheId = uuidv4()

		const index = position === "above" ? childIndex : childIndex + 1

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "delete-create",
			componentId: selectedComponent.dataset.harmonyId!,
			childIndex,
			oldValue: JSON.stringify({ id: cacheId, action: action === "delete" ? "create" : "delete", index: action === "delete" ? childIndex : index, position: "" }),
			value: JSON.stringify({ id: cacheId, action, index: childIndex, position })
		}
		onAttributesChange([update])
	}
	const selectedNodes = ['2', '6'];
	function nodeSelected(e: NodeSelectEventArgs) {
		const start = treeObj!['startNode'] as HTMLElement
		const startId = start.children[1].innerHTML.split('data-node=')[1].split('"')[1]
		const startNode: HTMLElement = document.querySelector(`[data-link="${startId}"]`)!
		const end = e.node
		const endId = end.children[1].innerHTML.split('data-node=')[1].split('"')[1]
		const endNode: HTMLElement = document.querySelector(`[data-link="${endId}"]`)!
		setMultiSelect({ start: startNode, end: endNode })
	}

	function handleWrapElement(action: "wrap" | "unwrap") {
		const startComponent = document.querySelector(`[data-link="${multiSelect?.start.dataset.link}"]`)!
		const startChildIndex = Array.from(startComponent.parentElement!.childNodes).indexOf(startComponent)
		const endComponent = document.querySelector(`[data-link="${multiSelect?.end.dataset.link}"]`)!
		const endChildIndex = Array.from(endComponent.parentElement!.childNodes).indexOf(endComponent)

		const componentId = () => {
			if (action === "wrap") {
				return uuidv4()
			} 
				return multiSelect?.start.dataset.harmonyId
			
		}

		const cacheId = uuidv4()

		const unwrap = {
			action: "unwrap",
			start: { id: multiSelect?.start.dataset.harmonyId, childIndex: startChildIndex },
			end: { id: multiSelect?.end.dataset.harmonyId, childIndex: endChildIndex },
			id: cacheId
		}

		const wrap = {
			action: "wrap",
			start: { id: multiSelect?.start.dataset.harmonyId, childIndex: startChildIndex },
			end: { id: multiSelect?.end.dataset.harmonyId, childIndex: endChildIndex },
			id: cacheId
		}

		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "wrap-unwrap",
			componentId: componentId()!,
			childIndex: startChildIndex,
			oldValue: JSON.stringify(action === "wrap" ? unwrap : wrap),
			value: JSON.stringify(action === "wrap" ? wrap : unwrap)
		}
		onAttributesChange([update])
	}

	const handleAddText = () => {
		if (!selectedComponent) return;
		const childIndex = Array.from(selectedComponent.parentElement!.childNodes).indexOf(selectedComponent)
		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "replace-element",
			componentId: selectedComponent.dataset.harmonyId!,
			childIndex,
			oldValue: JSON.stringify({ type: 'text', value: "" }),
			value: JSON.stringify({ type: 'text', value: "[Insert Text]" })
		}
		onAttributesChange([update])
	}

	const handleAddImage = (value: string, type: ImageType) => {
		if (!selectedComponent) return;
		setIsImageOpen(false);
		const childIndex = Array.from(selectedComponent.parentElement!.childNodes).indexOf(selectedComponent)
		const update: ComponentUpdateWithoutGlobal = {
			type: "component",
			name: "replace-element",
			componentId: selectedComponent.dataset.harmonyId!,
			childIndex,
			oldValue: JSON.stringify({ type, value: "" }),
			value: JSON.stringify({ type, value })
		}
		onAttributesChange([update])
	}

	const isGroup = useMemo(() => {
		if (selectedComponent) {
			if (selectedComponent.children.length > 0) {
				return true
			}
		}
		return false
	}, [selectedComponent])

	const isEmptyDiv = useMemo(() => {
		if (selectedComponent) {
			if (selectedComponent.children.length === 0 && selectedComponent.tagName === "DIV") {
				return true
			}
		}
	}, [selectedComponent])

	return (
		transformedItems && (
			<div>
				{selectedComponent && (
					<>
						<div className="hw-flex hw-flex-row hw-space-x-4">
							<div onClick={() => handleAddDeleteElement("create", "above")}>
								<Button >Add Above</Button>
							</div>
							<div onClick={() => handleAddDeleteElement("create", "below")}>
								<Button>Add Below</Button>
							</div>
							<div onClick={() => handleAddDeleteElement("delete")}>
								<Button>Delete</Button>
							</div>
						</div>
						<div className="hw-flex hw-flex-row hw-space-x-4 hw-mt-4">
							{multiSelect && (
								<div onClick={() => handleWrapElement("wrap")}>
									<Button>Wrap</Button>
								</div>
							)}
							{isGroup && (
								<div onClick={() => handleWrapElement("unwrap")}>
									<Button>UnWrap</Button>
								</div>
							)}
							{isEmptyDiv && <>
								<div onClick={handleAddText}>
									<Button>Add Text</Button>
								</div>
								<div onClick={() => setIsImageOpen(true)}>
									<Button>Add Image/SVG</Button>
								</div>
							</>}
						</div>
					</>
				)}
				<TreeViewComponent
					fields={fields}
					allowDragAndDrop={true}
					nodeDragStart={nodeDragStart.bind(this)}
					nodeDragStop={dragStop.bind(this)}
					ref={(treeview) => { treeObj = treeview; }}
					nodeDropped={handleNodeDropped}
					nodeTemplate={TreeViewItem}
					drawNode={drawNode}
					allowMultiSelection={true}
					selectedNodes={selectedNodes}
					nodeSelected={nodeSelected}
				/>
				<AddImagePanel isOpen={isImageOpen} onClose={() => setIsImageOpen(false)} onSave={handleAddImage}/>
			</div>
		)
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
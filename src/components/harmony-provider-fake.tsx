'use client';
import { Input } from "postcss";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Inspector, OverlayRect, getElementDimensions, getNestedBoundingClientRect } from "./inspector/inspector-dev";
import { InspectParams, getElementFiber, useEffectEvent } from "./inspector/inspector-dev";
import { Fiber } from "react-reconciler";

const HarmonyProviderFake: React.FunctionComponent<{children: React.ReactNode}> = ({children}) => {
	const [container, setContainer] = useState<HTMLDivElement>();
	const [elementName, setElementName] = useState('');
	const [elementFiber, setElementFiber] = useState<Fiber>();
	const ref = useRef<HTMLDivElement>(null);
	const childRef = useRef<HTMLDivElement>(null);
	
	const onClick = useEffectEvent((e: React.PointerEvent<HTMLElement>) => {
		if (ref.current && !ref.current.contains(e.target)) {
			elementFiber && setElementFiber(undefined);
		}
	})

	useEffect(() => {
		const doc = window.document;
		const div = doc.createElement('div');

		setContainer(div);
		doc.body.appendChild(div);

		doc.addEventListener('click', onClick);

		return () => doc.removeEventListener('click', onClick);
	}, [])

	const getElementFromFiber = (_node: Fiber | null): HTMLElement | undefined => {
		if (_node === null) return undefined;
		if (typeof _node.type === 'string') return _node.stateNode as HTMLElement

		return getElementFromFiber(_node.child);
	}

	const onInspect = ({codeInfo, name, fiber, element}: Required<InspectParams>) => {
		if (container === undefined || !childRef.current?.contains(element)) return;
		//container.innerHTML = '';
		setElementFiber(fiber);
	}

	const onHover = ({name, element, fiber}: InspectParams) => {
		if (container === undefined || !childRef.current?.contains(element)) return;
		container.innerHTML = '';
		const doc = window.document;
		const overlayRect = new OverlayRect(doc, container);
		overlayRect.update(getNestedBoundingClientRect(element, window), getElementDimensions(element));

		setElementName(name || 'None');
		//doc.body.appendChild(container);
		
	}

	const onFiberHover = (node: Fiber) => {
		const element = getElementFromFiber(node);
		
		onHover({name: typeof node.type === 'function' ? node.type.name : node.type, fiber: node, element})
	}

	const onFiberClick = (node: Fiber) => {
		const element = getElementFromFiber(node);

		onInspect({name: typeof node.type === 'function' ? node.type.name : node.type, fiber: node, element})
	}

	const rootFiber = childRef.current ? getElementFiber(childRef.current) : null;
	return (<>
		<Inspector onInspectElement={onInspect} active={elementFiber === undefined} onHoverElement={onHover}>
			<div ref={childRef}>
				{children}
			</div>
		</Inspector>
		{container ? createPortal(<div ref={ref} className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100000]">
			<div className="text-center">
				{elementName}
			</div>
			<div className="absolute right-0 flex flex-col h-full border border-gray-200 p-4 bg-white pointer-events-auto min-w-[400px]">
				<div className="flex-1">
					{elementFiber ? <FiberDisplay fiber={elementFiber} key={elementFiber.key}/> : null}
				</div>
				<div className="flex-1 overflow-auto">
					{rootFiber ? <ComponentTree node={rootFiber} expand={true} onHover={onFiberHover} onClick={onFiberClick}/> : null}
				</div>
			</div>
		</div>, document.body) : null}
		</>
	)
}

//\<(\w+)\s?.*\>(?:[^<>]+|(?R))*+\<\/\1>

function buildTreeViewItems(node: Fiber): TreeViewItem[] {
	let items: TreeViewItem[] = [];
	const type = node.type as string | Function;
	if (typeof type === 'function') {
		items.push({content: type.name, items: node.child ? buildTreeViewItems(node.child) : []});
		if (node.sibling) {
			items = items.concat(buildTreeViewItems(node.sibling));
		}
	} else {
		return node.child ? buildTreeViewItems(node.child) : [];
	}

	return items;
}

// node
//    node.child
//       node.child.child
//    node.child.sibling
//    node.child.sibling.sibling
// node.sibling
//    node.sibling.child
// node.sibling.sibling

interface ComponentTreeItemProps {
	node: Fiber, 
	onHover: (node: Fiber) => void, 
	onClick: (node: Fiber) => void,
	showHTML?: boolean
}
const ComponentTreeItem: React.FunctionComponent<ComponentTreeItemProps> = ({node, onHover, onClick, showHTML=false}) => {
	const [childExpand, setChildExpand] = useState(false);
	const type = node.type as string | Function;

	const onExpand = () => {
		setChildExpand(!childExpand);
	}

	const hasChildren = (_node: Fiber | null): _node is Fiber => {
		if (_node == null) return false;
		if (showHTML) return true;
		//return true;

		if (typeof _node.type === 'function') return true;

		if (hasChildren(_node.child)) return true;

		return hasChildren(_node.sibling);
	}
	
	return <>
		{
		(showHTML ? typeof type !== 'function' && typeof type !== 'string' : 
		typeof type !== 'function')
		? node.child ? <ComponentTreeItem node={node.child} onHover={onHover} onClick={onClick}/> : null : 
		!hasChildren(node.child) ? <li className="px-2 hover:bg-gray-100" onMouseOver={(e) => {e.preventDefault(); e.stopPropagation(); onHover(node)}} onClick={(e) => {e.preventDefault(); e.stopPropagation(); onClick(node);}}>{type.name || type}</li> :
		<li onMouseOver={(e) => {e.preventDefault(); e.stopPropagation(); onHover(node)}} onClick={(e) => {e.preventDefault(); e.stopPropagation(); onClick(node);}}>
			<button
				onClick={onExpand}
				role="button"
				aria-expanded="false"
				aria-controls="collapseThree"
				className="flex items-center px-2 hover:bg-gray-100 focus:text-primary active:text-primary">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2.5"
					stroke="currentColor"
					className={getClass('h-4 w-4', childExpand ? 'rotate-90' : '')}>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
				{type.name || type}
			</button>
			<ComponentTree node={node.child} expand={childExpand} onHover={onHover} onClick={onClick}/>
		</li>}
		{node.sibling ? <ComponentTreeItem node={node.sibling} onHover={onHover} onClick={onClick}/> : null}
	</>
}

const ComponentTree: React.FunctionComponent<{node: Fiber, expand: boolean, onHover: (node: Fiber) => void, onClick: (node: Fiber) => void}> = ({node, expand, onHover, onClick}) => {
	return <>
		<ul className={getClass('!visible ml-2', expand ? '' : 'hidden')}>
			<ComponentTreeItem node={node} onHover={onHover} onClick={onClick}/>
		</ul>
	</>
}

const FiberDisplay: React.FunctionComponent<{fiber: Fiber}> = ({fiber}) => {
	//const [className, setClassName] = useState<string | undefined>(typeof fiber.memoizedProps === 'object' && 'className' in fiber.memoizedProps && typeof fiber.memoizedProps.className === 'string' ? fiber.memoizedProps.className : undefined);
	const type = fiber.type as string | Function;
	const name = typeof type == 'function' ? type.name : type;

	const props = typeof fiber.memoizedProps === 'object' ? fiber.memoizedProps : {};
	
	// const onClassName = (value: string) => {
	// 	setClassName(value);
	// }
	return (
		<div className="">
			<Header level={2}>{name}</Header>
			<Header level={3}>Props</Header>
			{Object.entries(props).map(([key, value]) => <Label label={key} key={key}>
				<Input value={value} onChange={() => undefined}/>
			</Label>)}
			{/* {className ? <Label label="className"> */}
				{/* <Input value={className} onChange={onClassName}/> */}
			{/* </Label> : null} */}
		</div>
	)
}

interface TreeViewItem {
	content: React.ReactNode,
	items: TreeViewItem[]
}
const TreeView: React.FunctionComponent<{items: TreeViewItem[], expand?: boolean}> = ({items, expand}) => {
	const [childExpand, setChildExpand] = useState(false);
	const onExpand = () => {
		setChildExpand(!childExpand);
	}

	return <>
		<ul className={getClass('!visible', expand ? '' : 'hidden')}>
			{items.map(item => <>
			{item.items.length === 0 ? <li className="px-2 hover:bg-gray-100">{item.content}</li> : null}
			{item.items.length > 0 ? <li>
				<button
					onClick={onExpand}
					role="button"
					aria-expanded="false"
					aria-controls="collapseThree"
					className="flex items-center px-2 hover:bg-gray-100 focus:text-primary active:text-primary">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2.5"
						stroke="currentColor"
						className="h-4 w-4">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8.25 4.5l7.5 7.5-7.5 7.5" />
					</svg>
					{item.content}
				</button>
				<TreeView items={items} expand={childExpand}/>
			</li> : null}
			</>)}
		</ul>
	</>
}
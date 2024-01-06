import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ComponentElement, HarmonyComponent } from '@harmony/types/component';
import { hashComponent } from '@harmony/utils/util';
import fs from 'node:fs';
import path from 'node:path';

export let info: {componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[]};

type globalInfo = (typeof globalThis & {info: typeof info});

if (process.env.NODE_ENV === 'production') {
  info = {
	componentDefinitions: {},
	elementInstances: [],
};
} else {
  if (!(global as globalInfo).info) {
    (global as globalInfo).info = {
			componentDefinitions: {},
			elementInstances: [],
		};
  }
  info = (global as globalInfo).info;
}

export async function GET(req: Request): Promise<Response> {
	const dirname = process.cwd();

	const files: string[] = [];
	fromDir(dirname, /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$/, (filename) => files.push(filename));

	for (const file of files) {
		updateReactCode(file, info.componentDefinitions, info.elementInstances);
	}

	return new Response(JSON.stringify(info.elementInstances.map(el => Number(el.id))), {
		status: 200,
	})
}

function randomId(): string {
	return String(Math.random()).hashCode().toString();
}

function fromDir(startPath: string, filter: RegExp, callback: (filename: string) => void) {
	if (!fs.existsSync(startPath)) {
			console.log("no dir ", startPath);
			return;
	}

	var files = fs.readdirSync(startPath);
	for (var i = 0; i < files.length; i++) {
			var filename = path.join(startPath, files[i]);
			var stat = fs.lstatSync(filename);
			if (stat.isDirectory()) {
					fromDir(filename, filter, callback); 
			} else if (filter.test(filename)) {
				callback(filename);
			}
	};
};

function updateReactCode(file: string, componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[]): boolean {
  const originalCode = fs.readFileSync(file, 'utf8');
		
	const ast = parse(originalCode, {
    sourceType: 'module',
 		plugins: ['jsx', 'typescript'],
  });

	if (!ast) return false;

	const declarationStack: (t.VariableDeclarator | t.FunctionDeclaration)[] = [];
	const componentsStack: HarmonyComponent[] = [];
	const elementsStack: (t.JSXElement | t.JSXFragment)[] = [];
	const parentStack: ComponentElement[] = [];

	// const visitDeclaration = (node: t.VariableDeclarator | t.FunctionDeclaration) => {
	// 	if (node.id?.type !== 'Identifier') {
	// 		throw new Error("What is this ish");
	// 	}

	// 	if (!node.loc) {
	// 		throw new Error("Invalid Node index");
	// 	}

	// 	const component: HarmonyComponent = {
	// 		id: randomId(), 
	// 		name: node.id.name, 
	// 		children: [], 
	// 		location: {
	// 			file,
	// 			start: node.loc.start.index,
	// 			end: node.loc.end.index
	// 		},
	// 		isComponent: true, 
	// 		attributes: []
	// 	}

	// 	componentsStack.push(component);
	// 	parentStack.push(component);

	// 	if (componentDefinitions[component.name]) {
	// 		throw new Error(`A definition for component ${component.name} already exists`);
	// 	}

	// 	componentDefinitions[component.name] = component;
	// }

	// traverse(ast, {
  //   JSXText(path) {
	// 		// if (path.node.value.trim() === newText) {
  //     //   path.node.value = 'Updated Text';
  //     // }
  //   },
	// 	VariableDeclarator(path) {
	// 		if (path.node.init?.type === 'FunctionExpression' || path.node.init?.type === 'ArrowFunctionExpression') {
				
	// 		}
	// 		declarationStack.push(path.node);
	// 	},
	// 	FunctionDeclaration(path) {
	// 		declarationStack.push(path.node);
	// 	},
	// 	JSXFragment(path) {
	// 		if (componentsStack.length === 0) {
	// 			visitDeclaration(declarationStack[declarationStack.length - 1]);
	// 		}
	// 		elementsStack.push(path.node);
	// 	},
	// 	JSXElement(path) {
	// 		// if (path.node.openingElement.name.type !== 'JSXIdentifier') {
	// 		// 	throw new Error("что токое");
	// 		// }

	// 		const getNameFromNode = (name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): string => {
	// 			if (name.type === 'JSXIdentifier') {
	// 				return name.name;
	// 			}

	// 			if (name.type === 'JSXMemberExpression') {
	// 				return `${getNameFromNode(name.object)}.${getNameFromNode(name.property)}`;
	// 			}

	// 			return `${getNameFromNode(name.namespace)}.${getNameFromNode(name.name)}`
	// 		}

	// 		const elementName = getNameFromNode(path.node.openingElement.name);

	// 		if (componentsStack.length === 0) {
	// 			visitDeclaration(declarationStack[declarationStack.length - 1]);
	// 		}
	// 		//const currComponent = componentsStack[componentsStack.length - 1];
	
	// 		//const currElement = elementsStack.length > 0 ? elementsStack[elementsStack.length - 1] : undefined;

	// 		const parentElement = parentStack[parentStack.length - 1];//currElement ?? currComponent;
	// 		if (!path.node.loc) {
	// 			throw new Error('Invalid node location');
	// 		}

	// 		let _id: string | undefined = randomId();
	// 		const isComponent = elementName[0].toLowerCase() !== elementName[0] || Boolean(componentDefinitions[elementName]);

	// 		if (!isComponent) {
	// 			let className = '';
	// 			for (const attribute of path.node.openingElement.attributes) {
	// 				if (attribute.type !== 'JSXAttribute') {
	// 					_id = undefined;
	// 					break;
	// 					//throw new Error("Spread attributes are not yet supported on native elements");
	// 				}

	// 				if (attribute.name.name !== 'className') {
	// 					continue;
	// 				}

	// 				if (attribute.value?.type !== 'StringLiteral') {
	// 					_id = undefined;
	// 					break;
	// 					//throw new Error("Dynamic attributes are not yet supported for className");
	// 				}

	// 				className += attribute.value.value;
	// 			}

	// 			if (className) {
	// 				_id = String(hashComponent({elementName, className, childPosition: parentElement.children.length}));
	// 			} else {
	// 				_id = undefined;
	// 			}
	// 		}
			
	// 		const element: ComponentElement = {
	// 			id: String(_id),
	// 			name: elementName,
	// 			children: [],
	// 			attributes: [],
	// 			location: {
	// 				file,
	// 				start: path.node.loc.start.index,
	// 				end: path.node.loc.end.index,
	// 			},
	// 			isComponent,
	// 			getParent() {
	// 				return parentElement;
	// 			}
	// 		}

	// 		parentElement.children.push(element);
	// 		elementsStack.push(path.node);
	// 		parentStack.push(element);

	// 		if (_id !== undefined) {
	// 			elementInstances.push(element);
	// 			// if (elementInstances[element.id]) {
	// 			// 	throw new Error(`A definition for element ${element.id} already exists`);
	// 			// }
	// 			// elementInstances[element.id] = element;
	// 		}
	// 	},
	// 	exit(path, state) {
	// 		if (path.node.type === 'VariableDeclarator' || path.node.type === 'FunctionDeclaration') {
	// 			declarationStack.pop();

	// 		} else if (path.node.type === 'JSXElement' || path.node.type === 'JSXFragment') {
	// 			elementsStack.pop();
	// 			parentStack.pop();
	// 			if (elementsStack.length === 0) {
	// 				componentsStack.pop();
	// 			}
	// 		}
	// 	}
  // });

	//const componentDefinitions: Record<string, HarmonyComponent> = {};

	// traverse(ast, {
	// 	// Visitor for extracting component definitions
	// 	['FunctionDeclaration|ArrowFunctionExpression'](path) {
	// 		const jsxElements: ComponentElement[] = [];

	// 		if (!path.node.loc) {
	// 			throw new Error("No location for function");
	// 		}

	// 		// Visitor for extracting JSX elements within the function body
	// 		path.traverse({
	// 			JSXElement(jsPath) {
	// 				const jsxElementDefinition = extractJSXElementDefinition(jsPath);
	// 				jsxElements.push(jsxElementDefinition);
	// 			},
	// 		});

	// 		// Only consider functions with JSX elements as potential React components
	// 		if (jsxElements.length > 0) {
	// 			let componentName = 'AnonymousComponent';

	// 			// Check if the function is assigned to a variable or exported
	// 			if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
	// 				componentName = path.parent.id.name;
	// 			} else if (t.isExportDeclaration(path.parent) && t.isIdentifier(path.parent.declaration?.id)) {
	// 				componentName = path.parent.declaration.id.name;
	// 			} else if (t.isFunctionDeclaration(path.node) && t.isIdentifier(path.node.id)) {
	// 				componentName = path.node.id.name;
	// 			}
	// 			const id = randomId();

	// 			componentDefinitions[id] = {
	// 				id,
	// 				name: componentName,
	// 				location: {
	// 					file,
	// 					start: path.node.loc?.start.index,
	// 					end: path.node.loc?.end.index,
	// 				},
	// 				children: jsxElements,
	// 				isComponent: true,
	// 				getParent() {

	// 				},
	// 				attributes: [],
	// 			};
	// 		}
	// 	},
	// });

	const getNameFromNode = (name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName): string => {
		if (name.type === 'JSXIdentifier') {
			return name.name;
		}

		if (name.type === 'JSXMemberExpression') {
			return `${getNameFromNode(name.object)}.${getNameFromNode(name.property)}`;
		}

		return `${getNameFromNode(name.namespace)}.${getNameFromNode(name.name)}`
	}

	const getHashFromElement = (node: t.JSXElement, parentElement: ComponentElement | undefined, isComponent: boolean): string | undefined => {
		const name = getNameFromNode(node.openingElement.name);
		let _id: string | undefined = randomId();

		if (!isComponent) {
			let className = '';
			for (const attribute of node.openingElement.attributes) {
				if (attribute.type !== 'JSXAttribute') {
					_id = undefined;
					break;
					//throw new Error("Spread attributes are not yet supported on native elements");
				}

				if (attribute.name.name !== 'className') {
					continue;
				}

				if (attribute.value?.type !== 'StringLiteral') {
					_id = undefined;
					break;
					//throw new Error("Dynamic attributes are not yet supported for className");
				}

				className += attribute.value.value;
			}

			if (className) {
				_id = String(hashComponent({elementName: name, className, childPosition: parentElement?.children.length ?? 1}));
			} else {
				_id = undefined;
			}
		}

		return _id;
	}

	function getLocation(node: t.Node, file: string) {
		if (!node.loc) {
			return undefined;
		}

		return {
			file,
			start: node.loc.start.index,
			end: node.loc.end.index,
		}
	}

	function createJSXElementDefinition(node: t.JSXElement, parentElement: ComponentElement | undefined, containingComponent: HarmonyComponent, file: string): ComponentElement | undefined {
		const name = getNameFromNode(node.openingElement.name);
		const isComponent = name[0].toLowerCase() !== name[0];
		const id = getHashFromElement(node, parentElement, isComponent);
		if (id === undefined) {
			return undefined;
		}
		const location = getLocation(node, file);
		if (location === undefined) {
			return undefined;
		}

		return {
			id,
			name,
			getParent() {
				return parentElement
			},
			children: [],
			isComponent,
			location,
			attributes: [],
			containingComponent
		};
	}

	traverse(ast, {
		['FunctionDeclaration|ArrowFunctionExpression'](path) {
			const jsxElements: ComponentElement[] = [];
			const location = getLocation(path.node, file);

			if (location === undefined) {
				throw new Error("Cannot find location");
			}

			const containingComponent: HarmonyComponent = {
				id: randomId(),
				name: '',
				children: [],
				attributes: [],
				isComponent: true,
				location
			};
	
			// Visitor for extracting JSX elements within the function body
			path.traverse({
				JSXElement: {
					enter(jsPath) {
						const parentElement = jsxElements.length > 0 ? jsxElements[jsxElements.length - 1] : undefined;
						const jsxElementDefinition = createJSXElementDefinition(jsPath.node, parentElement, containingComponent, file);
						const parentComponent = parentElement ?? containingComponent;
						if (jsxElementDefinition) {
							jsxElements.push(jsxElementDefinition);
							elementInstances.push(jsxElementDefinition);
							parentComponent.children.push(jsxElementDefinition);
						}
					},
					exit() {
						jsxElements.pop();
					}
				}
			});
	
			// Only consider functions with JSX elements as potential React components
			if (containingComponent.children.length > 0) {
				let componentName = 'AnonymousComponent';
	
				// Check if the function is assigned to a variable or exported
				if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
					componentName = path.parent.id.name;
				} else if (t.isExportDeclaration(path.parent) && path.parent.type !== 'ExportAllDeclaration' && t.isIdentifier(path.parent.declaration?.id)) {
					componentName = path.parent.declaration.id.name;
				} else if (t.isFunctionDeclaration(path.node) && t.isIdentifier(path.node.id)) {
					componentName = path.node.id.name;
				}
	
				containingComponent.name = componentName;
				componentDefinitions[containingComponent.name] = containingComponent;
			}
		},
	});

	// function extractJSXElementDefinition(jsPath: NodePath<t.JSXElement>): ComponentElement {
	// 	const jsxElementName = jsPath.node.openingElement.name.name;
	// 	const children: ComponentElement[] = [];

	// 	// Recursively visit children
	// 	jsPath.traverse({
	// 		JSXElement(childPath) {
	// 			const childJSXElementDefinition = extractJSXElementDefinition(childPath);
	// 			children.push(childJSXElementDefinition);
	// 		},
	// 	});

	// 	return {
	// 		name: jsxElementName,
	// 		children,
	// 	};
	// }

	return true;
}
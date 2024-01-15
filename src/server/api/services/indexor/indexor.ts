import { prisma } from "@harmony/server/db";
import { HarmonyComponent, ComponentElement } from "@harmony/types/component";
import { hashComponent } from "@harmony/utils/util";
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import fs from 'node:fs';
import * as t from '@babel/types';

export type ReadFiles = (dirname: string, regex: RegExp, callback: (filename: string, content: string) => void) => Promise<void>;
export const indexCodebase = async (dirname: string, fromDir: ReadFiles) => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const elementInstances: ComponentElement[] = [];

	await fromDir(dirname, /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$/, (filename, content) => {
		updateReactCode(filename, content, componentDefinitions, elementInstances);
	});

	for (const instance of elementInstances) {
		const parent = instance.getParent();

		const currComponent = await prisma.componentElement.findUnique({
			where: {
				id: instance.id
			}
		});

		let definition = await prisma.componentDefinition.findUnique({
			where: {
				name: instance.containingComponent.name
			}
		})
		if (definition === null) {
			definition = await prisma.componentDefinition.create({
				data: {
					name: instance.containingComponent.name,
					file: instance.containingComponent.location.file,
					start: instance.containingComponent.location.start,
					end: instance.containingComponent.location.end,
				}
			})
		}

		if (!currComponent) {
			const newElement = await prisma.componentElement.create({
				data: {
					id: instance.id,
					name: instance.name,
					file: instance.location.file,
					start: instance.location.start,
					end: instance.location.end,
					parent_id: parent?.id,
					definition_id: definition.id
				}
			})
		} else {
			await prisma.componentElement.update({
				where: {
					id: instance.id
				},
				data: {
					id: instance.id,
					name: instance.name,
					file: instance.location.file,
					start: instance.location.start,
					end: instance.location.end,
					parent_id: parent?.id,
					definition_id: definition.id
				}
			})
		}
	}
}

function updateReactCode(file: string, originalCode: string, componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[]): boolean {
  const ast = parse(originalCode, {
    sourceType: 'module',
 		plugins: ['jsx', 'typescript'],
  });

	if (!ast) return false;

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
				} else if (t.isExportDeclaration(path.parent) && path.parent.type !== 'ExportAllDeclaration' && path.parent.declaration && 'id' in path.parent.declaration && t.isIdentifier(path.parent.declaration?.id)) {
					componentName = path.parent.declaration.id.name;
				} else if (t.isFunctionDeclaration(path.node) && t.isIdentifier(path.node.id)) {
					componentName = path.node.id.name;
				}
	
				containingComponent.name = componentName;
				componentDefinitions[containingComponent.name] = containingComponent;
			}
		},
	});

	return true;
}

function randomId(): string {
	return String(Math.random()).hashCode().toString();
}
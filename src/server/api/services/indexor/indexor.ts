import { prisma } from "../../../../../src/server/db";
import { HarmonyComponent, ComponentElement, ComponentLocation } from "../../../../../packages/ui/src/types/component";
import { getLineAndColumn, hashComponent } from "../../../../../packages/util/src/index";
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import tailwindcss from 'tailwindcss';

export type ReadFiles = (dirname: string, regex: RegExp, callback: (filename: string, content: string) => void) => Promise<void>;
export const indexCodebase = async (dirname: string, fromDir: ReadFiles, repoId: string, onProgress?: (progress: number) => void) => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const instances: ComponentElement[] = [];

	await fromDir(dirname, /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$/, (filename, content) => {
		updateReactCode(filename, content, componentDefinitions, instances);
	});

	const isComponentInstance = (instance: ComponentElement): boolean => {
		return instance.name[0] === instance.name[0].toUpperCase();
	}

	const elementInstances: ComponentElement[] = [];
	const calledComponent: string[] = [];
	for (const instance of instances) {
		if (isComponentInstance(instance)) {
			const definition = componentDefinitions[instance.name];
			if (!definition) continue;

			for (const definitionInstance of definition.children) {
				elementInstances.push({...definitionInstance, parentId: instance.id, getParent: () => instance});
			}
			calledComponent.push(definition.name);
		}
	}

	//If a component has not been called, then that means it has no parent, so add that in
	for (const name in componentDefinitions) {
		if (!calledComponent.includes(name)) {
			elementInstances.push(...componentDefinitions[name].children);
		}
	}

	const alreadyCreated: string[] = [];
	const createElement = async (instance: ComponentElement) => {
		if (alreadyCreated.includes(`${instance.id}${instance.parentId}`)) return;

		const parent = instance.getParent();

		const currComponent = await prisma.componentElement.findFirst({
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
					repository_id: repoId,
					name: instance.containingComponent.name,
					location: {
						create: {
							file: instance.containingComponent.location.file,
							start: instance.containingComponent.location.start,
							end: instance.containingComponent.location.end,
						}
					}
				}
			})
		}
		if (parent) {
			const prismaParent = await prisma.componentElement.findFirst({
				where: {
					id: parent.id,
					parent_id: parent.parentId
				}
			});
			if (!prismaParent) {
				await createElement(parent);
			}
		}
		let locationId = currComponent?.location_id;
		if (!locationId) {
			const location = await prisma.location.create({
				data: {
					file: instance.location.file,
					start: instance.location.start,
					end: instance.location.end,
				}
			});
			locationId = location.id;
		}

		try {
			
		const newElement = await prisma.componentElement.create({
			data: {
				id: instance.id,
				repository_id: repoId,
				name: instance.name,
				parent_id: parent?.id || '',
				parent_parent_id: parent?.parentId || null,
				location_id: locationId,
				definition_id: definition.id
				// parent: parent ? {
				// 	connect: {
				// 		id_parent_id: {
				// 			id: parent.id,
				// 			parent_id: parent.parentId
				// 		}
				// 	}
				// } : undefined,
				// location: currComponent ? {
				// 	connect: {
				// 		id: currComponent.location_id
				// 	}
				// }: {
				// 	create: {
				// 		file: instance.location.file,
				// 		start: instance.location.start,
				// 		end: instance.location.end,
				// 	}
				// },
				// definition: {
				// 	connect: {
				// 		id: definition.id
				// 	}
				// }
			}
		});

		await prisma.componentAttribute.createMany({
			data: instance.attributes.map(attr => ({
				name: attr.name,
				type: attr.type,
				value: attr.value,
				component_id: newElement.id, 
				component_parent_id: newElement.parent_id,
				location_id: newElement.location_id
			}))
		});
	} catch(err) {
		console.log(instance);
	}
		alreadyCreated.push(`${instance.id}${instance.parentId}`);
	}
	for (let i = 0; i < elementInstances.length; i++) {
		await createElement(elementInstances[i]);
		onProgress && onProgress(i/elementInstances.length)
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

	const getHashFromLocation = (location: ComponentLocation, codeSnippet: string): string => {
		const {file, start, end} = location;
		const {line: startLine, column: startColumn} = getLineAndColumn(codeSnippet, start);
		const {line: endLine, column: endColumn} = getLineAndColumn(codeSnippet, end);

		return btoa(`${file}:${startLine}:${startColumn}:${endLine}:${endColumn}`);
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

	function createJSXElementDefinition(node: t.JSXElement, parentElement: ComponentElement | undefined, containingComponent: HarmonyComponent, file: string, snippet: string): ComponentElement | undefined {
		const name = getNameFromNode(node.openingElement.name);
		const isComponent = name[0].toLowerCase() !== name[0];
		const location = getLocation(node, file);
		if (location === undefined) {
			return undefined;
		}
		const id = getHashFromLocation(location, snippet);
		if (id === undefined) {
			return undefined;
		}

		return {
			id,
			parentId: '',
			name,
			getParent() {
				return undefined
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
				JSXIdentifier(jsPath) {

				},
				JSXElement: {
					enter(jsPath) {
						const parentElement = jsxElements.length > 0 ? jsxElements[jsxElements.length - 1] : undefined;
						const jsxElementDefinition = createJSXElementDefinition(jsPath.node, parentElement, containingComponent, file, originalCode);
			
						const parentComponent = containingComponent;
						if (jsxElementDefinition) {
							const node = jsPath.node;
							if (node.children.length === 1 && t.isJSXText(node.children[0])) {
								const child = node.children[0] as t.JSXText;
								jsxElementDefinition.attributes.push({id: '', type: 'text', name: '0', value: child.value})
							}	
							const classNameAttr = node.openingElement.attributes.find(attr => t.isJSXAttribute(attr) && attr.name.name === 'className') as t.JSXAttribute;
							if (classNameAttr && t.isStringLiteral(classNameAttr.value)) {
								console.log(tailwindcss)
								// const tailwindMapping = {
								// 	'font-sm': {name: 'font', value: 'small'}
								// }
								// const classNames = classNameAttr.value.value.split(' ');
								
							}
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
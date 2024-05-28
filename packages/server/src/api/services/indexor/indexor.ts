/* eslint-disable @typescript-eslint/prefer-for-of -- ok*/
/* eslint-disable @typescript-eslint/prefer-string-starts-ends-with -- ok*/
/* eslint-disable @typescript-eslint/restrict-template-expressions -- ok*/
/* eslint-disable @typescript-eslint/no-base-to-string -- ok*/
/* eslint-disable @typescript-eslint/no-empty-function -- ok*/
/* eslint-disable no-useless-computed-key -- ok*/
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
/* eslint-disable @typescript-eslint/no-shadow -- ok*/
/* eslint-disable no-useless-escape -- ok*/
/* eslint-disable @typescript-eslint/no-unused-vars -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import { prisma } from "@harmony/db/lib/prisma";
import { HarmonyComponent, ComponentElement, ComponentLocation, Attribute } from "@harmony/util/src/types/component";
import { getLineAndColumn, hashComponentId } from "@harmony/util/src/utils/component";
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { hashCode } from "@harmony/util/src/utils/common";
import { ComponentAttribute, ComponentDefinition } from "@harmony/db/lib/generated/client";
import { INDEXING_VERSION } from "@harmony/util/src/constants";

export type ReadFiles = (dirname: string, regex: RegExp, callback: (filename: string, content: string) => void) => Promise<void>;

export const indexFilesAndFollowImports = async (files: string[], readFile: (filepath: string) => Promise<string>, repositoryId: string): Promise<ComponentElement[]> => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const instances: ComponentElement[] = [];
	const importDeclarations: Record<string, {name: string, path: string}> = {};
	const visitedFiles: Set<string> = new Set<string>();
	const fileContents: FileAndContent[] = [];

	const visitPaths = async (filepath: string) => {
		if (visitedFiles.has(filepath)) return;

		visitedFiles.add(filepath);
		const content = await readFile(filepath);
		fileContents.push({file: filepath, content});
		// for (const componentName in importDeclarations) {
		// 	const {path: importPath, name} = importDeclarations[componentName];
		// 	const fullPath = path.join(filepath, importPath);
		// 	await visitPaths(fullPath);
		// }
	}

	for (const filepath of files) {
		await visitPaths(filepath);	
	}

	const elementInstance = getCodeInfoAndNormalizeFromFiles(fileContents, componentDefinitions, instances, importDeclarations);
	if (elementInstance) {
		await updateDatabase(componentDefinitions, elementInstance, repositoryId);
		return elementInstance;
	}

	return [];
}

export const indexCodebase = async (dirname: string, fromDir: ReadFiles, repoId: string, onProgress?: (progress: number) => void) => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const instances: ComponentElement[] = [];
	const fileContents: FileAndContent[] = [];

	await fromDir(dirname, /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$/, (filename, content) => {
		fileContents.push({file: filename, content});
	});

	const elementInstances = getCodeInfoAndNormalizeFromFiles(fileContents, componentDefinitions, instances, {});
	if (elementInstances) {
		await updateDatabase(componentDefinitions, elementInstances, repoId);
	}
}

interface FileAndContent {
	file: string;
	content: string;
}
export function getCodeInfoAndNormalizeFromFiles(files: FileAndContent[], componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[], importDeclarations: Record<string, {name: string, path: string}>): ComponentElement[] | false {
	for (const {file, content} of files) {
		if (!getCodeInfoFromFile(file, content, componentDefinitions, elementInstances, importDeclarations)) {
			return false;
		}
	}

	return normalizeCodeInfo(componentDefinitions, elementInstances);
}

export function getCodeInfoFromFile(file: string, originalCode: string, componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[], importDeclarations: Record<string, {name: string, path: string}>): boolean {
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

		return hashComponentId([{file, startColumn, startLine, endColumn, endLine}]);
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
		ImportDeclaration(path) {
			const importPath = path.node.source.value;
			for (const specifier of path.node.specifiers) {
				if (specifier.type === 'ImportSpecifier') {
					const name = specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value;
					const localName = specifier.local.name;
					importDeclarations[localName] = {path: importPath, name};
				} else if (specifier.type === 'ImportDefaultSpecifier') {
					const name = 'default';
					const localName = specifier.local.name;
					importDeclarations[localName] = {path: importPath, name};
				} else {
					//TODO: Deal with namespace import
				}
			}
		},
		['FunctionDeclaration|ArrowFunctionExpression'](path) {
			const jsxElements: ComponentElement[] = [];
			const location = getLocation(path.node, file);

			if (location === undefined) {
				throw new Error("Cannot find location");
			}

			const containingComponent: HarmonyComponent = {
				id: getHashFromLocation(location, originalCode),
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
						function getAttributeName(attribute: Attribute): string {
							if (attribute.type === 'className') {
								return 'className';
							} else if (attribute.type === 'text') {
								return 'children';
							}

							const [name] = attribute.value.split(':');
							return name;
						}

						function getPropertyName(attribute: Attribute): string | undefined {
							if (attribute.name !== 'property') return undefined;

							if (attribute.type === 'text') {
								return attribute.value === 'undefined' ? undefined : attribute.value;
							}

							const [_, propertyName] = attribute.value.split(':');
							return propertyName === 'undefined' ? undefined : propertyName; 
						}

						function getAttributeValue(attribute: Attribute): string {
							if (attribute.name === 'property') {
								return getPropertyName(attribute) || 'undefined';
							}

							if (attribute.type === 'property') {
								const [_, propertyValue] = attribute.value.split(':');
								return propertyValue;
							}

							return attribute.value;
						}

						function connectAttributesToParent(elementAttributes: Attribute[], parent: ComponentElement): Attribute[] {
							const attributes: Attribute[] = [];
							for (const attribute of elementAttributes) {
								const propertyName = getPropertyName(attribute);
								if (propertyName) {
									const sameAttributesInElement = parent.attributes.filter(attr => getAttributeName(attr) === propertyName).map(attr => {
										const newAttribute = {...attr};
										if (attribute.type === 'text') {
											newAttribute.value = getAttributeValue(newAttribute);
											newAttribute.type = 'text';
											newAttribute.index = attribute.index;
										} else if (attribute.type === 'property') {
											const name = getAttributeName(attribute);
											const value = getAttributeValue(newAttribute);

											newAttribute.value = `${name}:${value}`;
											newAttribute.type = 'property';
										} else if (attribute.type === 'className') {
											const value = getAttributeValue(newAttribute);
											newAttribute.value = newAttribute.name === 'property' ? `className:${value}` : value;
											newAttribute.type = 'className';
										}
										return newAttribute;
									});
	
									
									attributes.push(...sameAttributesInElement);
									continue;
								}
								attributes.push(attribute);
							}

							return attributes;
						}

						function connectChildToParent(child: ComponentElement, parent: ComponentElement): ComponentElement {
							const recurseConnectLog = (el: ComponentElement): string => {
								const parent = el.getParent();
								if (parent) {
									return `to ${parent.name} ${recurseConnectLog(parent)}`;
								}
								return '';
							}
							//console.log(`Connecting ${child.name} to ${parent.name} ${recurseConnectLog(parent)}`)
							const attributes = connectAttributesToParent(child.attributes, parent);
							const newElement = {...child, attributes, getParent: () => parent};
							elementInstances.push(newElement);

							return newElement;
						}

						function getComponentsBindingId(element: ComponentElement): string | undefined {
							if (!element.isComponent) return;

							const getId = (node: t.Node): string | undefined => {
								const location = getLocation(node, file);
								return location ? getHashFromLocation(location, originalCode) : undefined;
							}

							const binding = jsPath.scope.getBinding(element.name);
							let id: string | undefined;
							if (binding) {
								if (t.isFunctionDeclaration(binding.path.node) || t.isArrowFunctionExpression(binding.path.node)) {
									id = getId(binding.path.node);
								} else {
									binding.path.traverse({
										FunctionDeclaration(path) {
											if (id) return;
											const location = getLocation(path.node, file);
											id = location ? getHashFromLocation(location, originalCode) : undefined;
										},
										ArrowFunctionExpression(path) {
											if (id) return;
											const location = getLocation(path.node, file);
											id = location ? getHashFromLocation(location, originalCode) : undefined;
										}
									})
								}
							}
							if (!id) {
								id = componentDefinitions[element.name]?.id;
							}

							return id;
						}

						function connectInstanceToChildren(element: ComponentElement): void {
							const id = getComponentsBindingId(element);

							const childElements = elementInstances.filter(instance => instance.containingComponent.id === id && instance.getParent() === undefined);
							childElements.forEach(child => {
								const newChild = connectChildToParent(child, element);
								connectInstanceToChildren(newChild);
							});
						}

						function connectInstanceToParent(element: ComponentElement): void {
							const bindings: Record<string, string | undefined> = {}
							const parents = elementInstances.filter(parent => {
								let binding = bindings[parent.name];
								if (!binding) {
									bindings[parent.name] = getComponentsBindingId(parent);
									binding = bindings[parent.name]
								}
								return binding === element.containingComponent.id
							});
							parents.forEach(parent => {
								connectChildToParent(element, parent);
								//connectInstanceToParent(parent);
							});
						}

						const parentElement = jsxElements.length > 0 ? jsxElements[jsxElements.length - 1] : undefined;
						const jsxElementDefinition = createJSXElementDefinition(jsPath.node, parentElement, containingComponent, file, originalCode);

						const parentComponent = containingComponent;

						type AttributeType = 'text' | 'className' | 'property';
						
						if (jsxElementDefinition) {
							const createPropertyAttribute = (node: t.Node, type: AttributeType, name: string | undefined, propertyName: string | undefined): Attribute => {
								if (!node.start || !node.end) throw new Error(`Invalid start and end for node ${node}`);
								const location: ComponentLocation = {
									file,
									start: node.start,
									end: node.end
								}
								return createAttribute(type, 'property', name, propertyName, location);
							}
							const createIdentifierAttribute = (node: t.Identifier, type: AttributeType, name: string | undefined): Attribute[] => {
								const value = node.name;
								const binding = jsPath.scope.getBinding(value);
								const getAttributes = (_node: t.Node, values: Attribute[]): Attribute[] => {
									if (t.isIdentifier(_node)) {
										return values;
									} else if (t.isObjectPattern(_node)) {
										const property = _node.properties.find(prop => t.isObjectProperty(prop) && t.isIdentifier(prop.value) && prop.value.name === value) as t.ObjectProperty | undefined;
										const getPropertyName = () => {
											if (!property) return value;

											if (t.isIdentifier(property.key) && property.key.name === value) return value;

											const propertyAttribute = t.isExpression(property.key) ? createExpressionAttribute(property.key, type, name) : [];
											const propertyName = propertyAttribute.length === 1 ? getAttributeValue(propertyAttribute[0]) : '';

											return propertyName;
										}
										
										const propertyName = getPropertyName();
										const attributes = createAttributeFromObjects(node, values, type, name, propertyName);
										if (attributes.length) {
											return attributes;
										}
									}

									return values;
								}
								if (binding && ['const', 'let', 'var'].includes(binding.kind) && t.isVariableDeclarator(binding.path.node) && binding.path.node.init) {
									const idValues = createExpressionAttribute(binding.path.node.init, type, name);
									// if (idValues.length === 1 && getAttributeValue(idValues[0]) === 'param') {
									// 	return [createPropertyAttribute(node, type, name, value)];
									// } else 
									return getAttributes(binding.path.node.id, idValues);
								}

								if (binding && binding.kind === 'param') {
									const values = [createPropertyAttribute(node, type, name, 'param')];
									return getAttributes(binding.path.node, values);
								}

								return [createPropertyAttribute(node, type, name, value)]
							}

							const createAttributeFromObjects = (node: t.Node, objectAttributes: Attribute[], type: AttributeType, name: string | undefined, propertyName: string): Attribute[] => {
								const attributes: Attribute[] = [];
								for (const attribute of objectAttributes) {
									const attrName = getAttributeName(attribute);
									const attrValue = getAttributeValue(attribute);
									if (attrValue === 'param') {
										attributes.push(createPropertyAttribute(node, type, name, propertyName));
									} else if (attrName === propertyName) {
										const value = getAttributeValue(attribute);
										const newAttribute = createAttribute(type, attribute.name, name, value, attribute.location);
										attributes.push(newAttribute)
									}
								}

								return attributes;
							}

							const createMemberExpressionAttribute = (node: t.MemberExpression, type: AttributeType, name: string | undefined): Attribute[] => {
								if (t.isIdentifier(node.object) && t.isExpression(node.property)) {
									const objectAttributes = createIdentifierAttribute(node.object, type, name);
									const propertyAttributes = createExpressionAttribute(node.property, type, name);
									const propertyName = propertyAttributes.length === 1 ? getAttributeValue(propertyAttributes[0]) : '';
									const attributes = createAttributeFromObjects(node, objectAttributes, type, name, propertyName);
									if (attributes.length) {
										return attributes;
									}
								}

								return [createPropertyAttribute(node, type, name, undefined)];
							}

							const createObjectPropertiesAttribute = (properties: t.Node[], type: AttributeType, name: string | undefined): Attribute[] => {
								const attributes: Attribute[] = [];
								for (const property of properties) {
									if (t.isObjectProperty(property) && t.isIdentifier(property.key) && t.isExpression(property.value)) {
										const attrs = createExpressionAttribute(property.value, 'property', property.key.name);
										attributes.push(...attrs.map(attr => {
											const name = getAttributeName(attr);
											const value = getAttributeValue(attr);
											return createAttribute(attr.type as AttributeType, attr.name, name, value, attr.location)
										}))
									}
								}

								return attributes;
							}

							const createObjectExpressionAttribute = (node: t.ObjectExpression, type: AttributeType, name: string | undefined): Attribute[] => {
								return createObjectPropertiesAttribute(node.properties, type, name);
							}

							const createLogicalExpressionAttribute = (node: t.LogicalExpression, type: AttributeType, name: string | undefined): Attribute[] => {
								if (type === 'text') return [createPropertyAttribute(node, type, name, undefined)];
								return [...createExpressionAttribute(node.left, type, name), ...createExpressionAttribute(node.right, type, name)];
							}

							const createParamAttribute = (params: t.Node[], type: AttributeType, name: string | undefined): Attribute[] => {
								const expressions = params.filter(param => t.isExpression(param)) as t.Expression[];
								const attributes: Attribute[] = expressions.map(expression => createExpressionAttribute(expression, type, name)).flat()

								return attributes;
							}
	
							const createExpressionAttribute = (node: t.Expression | t.JSXEmptyExpression, type: AttributeType, name: string | undefined): Attribute[] => {
								if (t.isStringLiteral(node)) {
									return [createStringAttribute(node, type, name, node.value)]
								} else if (t.isCallExpression(node)) {
									const params = node.arguments
									return createParamAttribute(params, type, name);
								} else if (t.isTemplateLiteral(node)) {
									const expressions = [...node.expressions, ...node.quasis].sort((a, b) => (a.start || 0) - (b.start || 0));
									return expressions.map<Attribute[]>(expression => {
										if (t.isTemplateElement(expression) && expression.value.raw) {
											return [createStringAttribute(expression, type, name, expression.value.raw)];
										} else if (t.isExpression(expression)) {
											return createParamAttribute([expression], type, name);
										}

										return [];
									}).flat()
								} else if (t.isMemberExpression(node)) {
									return createMemberExpressionAttribute(node, type, name);
								} else if (t.isObjectExpression(node)) {
									return createObjectExpressionAttribute(node, type, name);
								} else if (t.isLogicalExpression(node)) {
									return createLogicalExpressionAttribute(node, type, name);
								} else if (t.isIdentifier(node)) {
									return createIdentifierAttribute(node, type, name);
								}

								//If we get here, then we could not resolve to a static string.
								return [createPropertyAttribute(node, type, name, undefined)];
							}
	
							const createStringAttribute = (node: t.StringLiteral | t.TemplateElement | t.JSXText, type: AttributeType, propertyName: string | undefined, value: string): Attribute => {
								if (!node.start || !node.end) throw new Error(`Invalid start and end for node ${node}`);
								const location: ComponentLocation = {
									file,
									start: node.start,
									end: node.end
								}
								return createAttribute(type, 'string', propertyName, value, location);
							}

							const createAttribute = (type: AttributeType, name: string, propertyName: string | undefined, value: string | undefined, location: ComponentLocation): Attribute => {
								if (name === 'string') {
									return {id: '', type, name: 'string', value: type === 'className' || !propertyName ? value || '' : `${propertyName}:${value}`, reference: jsxElementDefinition, index: -1, location}
								}

								return {id: '', type, name: 'property', value: propertyName ? `${propertyName}:${value}` : value || 'undefined', reference: jsxElementDefinition, index: -1, location};
							}

							const node = jsPath.node;
							const textAttributes: Attribute[] = [];
							const nonWhiteSpaceChildren = node.children.filter(n => !t.isJSXText(n) || n.value.trim().length > 0);
							for (let i = 0; i < nonWhiteSpaceChildren.length; i++) {
								const child = nonWhiteSpaceChildren[i];
								if (t.isJSXText(child)) {
									textAttributes.push({...createStringAttribute(child, 'text', undefined, child.extra?.raw as string || child.value), index: i});
								} else if (t.isJSXExpressionContainer(child)) {
									textAttributes.push({...createExpressionAttribute(child.expression, 'text', undefined)[0], index: i})
								}
							}
							jsxElementDefinition.attributes.push(...textAttributes);
							for (const attr of node.openingElement.attributes) {
								if (t.isJSXAttribute(attr)) {
									const type = attr.name.name === 'className' ? 'className' : 'property';
									if (t.isStringLiteral(attr.value)) {
										jsxElementDefinition.attributes.push(createStringAttribute(attr.value, type, String(attr.name.name), attr.value.value));
									} else if (t.isJSXExpressionContainer(attr.value)) {
										jsxElementDefinition.attributes.push(...createExpressionAttribute(attr.value.expression, type, String(attr.name.name)).map(expression => ({...expression, type})));
									}
								}
							}
							
							//console.log(`Adding ${jsxElementDefinition.name}`);
							jsxElements.push(jsxElementDefinition);
							elementInstances.push(jsxElementDefinition);
							parentComponent.children.push(jsxElementDefinition);

							connectInstanceToChildren(jsxElementDefinition);
							connectInstanceToParent(jsxElementDefinition);

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
				} else if (t.isCallExpression(path.parent) && t.isVariableDeclarator(path.parentPath?.parent) && t.isIdentifier(path.parentPath.parent.id)) {
					componentName = path.parentPath.parent.id.name;
				}
	
				containingComponent.name = componentName;
				componentDefinitions[containingComponent.name] = containingComponent;
			}
		},
	});

	return true;
}

function normalizeCodeInfo(componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[]) {
	function getIdFromParents(instance: ComponentElement): string {
		const parent = instance.getParent();
		if (!parent) {
			return instance.id;
		}

		if (parent.id.includes('#')) {
			return `${parent.id}#${instance.id}`;
		}

		const parentId = getIdFromParents(parent);

		return `${parentId}#${instance.id}`;
	}

	const findAttributeReference = (element: ComponentElement | undefined, attributeId: string): {id: string} | undefined=> {
		if (!element) return undefined;

		const id = element.id.split('#')[element.id.split('#').length - 1];
		if (id === attributeId) {
			return element;
		}

		return findAttributeReference(element.getParent(), attributeId);
	}

	for (let i = 0; i < elementInstances.length; i++) {
		const instance = elementInstances[i];
		instance.id = getIdFromParents(instance);
		for (const attribute of instance.attributes) {
			if (attribute.reference.id.split('#').length > 1) continue;
			const newReference = findAttributeReference(instance, attribute.reference.id);
			if (!newReference) {
				throw new Error("Reference should be pointer to an ancestor element");
			}
			attribute.reference = newReference;
		}
	}

	//Sort the instances parents first.
	return elementInstances;
}

//For future when mapping path alias will be a need
// function readTsConfig(tsConfigPath) {
// 	const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
// 	return tsConfig.compilerOptions.paths || {};
//   }
  
//   // Function to resolve path alias
//   function resolvePathAlias(alias, pathMappings) {
// 	// Find the alias in the pathMappings
// 	for (const [aliasKey, paths] of Object.entries(pathMappings)) {
// 	  if (alias.startsWith(aliasKey)) {
// 		const resolvedPath = alias.replace(aliasKey, paths[0]); // Use the first path mapping
// 		return path.resolve(resolvedPath);
// 	  }
// 	}
// 	return alias; // Return original alias if no mapping found
//   }
// const tsConfigPath = '/path/to/tsconfig.json';
// const aliasMappings = readTsConfig(tsConfigPath);

// // Resolve an alias
// const alias = '@harmony/ui/src/component';
// const resolvedPath = resolvePathAlias(alias, aliasMappings);

function randomId(): string {
	return hashCode(String(Math.random())).toString();
}

async function updateDatabase(componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[], repositoryId: string, onProgress?: (progress: number) => void) {
	elementInstances.sort((a, b) => b.id.split('#').length - a.id.split('#').length);
	const containingComponents = elementInstances.reduce<HarmonyComponent[]>((prev, curr) => {
		const def = prev.find(d => d.id === curr.containingComponent.id);
		if (!def) {
			prev.push(curr.containingComponent)
		}

		return prev;
	}, []);

	await Promise.all(containingComponents.map(component => prisma.componentDefinition.upsert({
		where: {
			id: component.id
		},
		create: {
			id: component.id,
			repository_id: repositoryId,
			name: component.name,
			location: {
				create: {
					file: component.location.file,
					start: component.location.start,
					end: component.location.end,
				}
			}
		},
		update: {
			id: component.id,
			repository_id: repositoryId,
			name: component.name,
		}
	})))

	for (let i = 0; i < elementInstances.length; i++) {
		const instance = elementInstances[i];
		await prisma.componentElement.upsert({
			where: {
				id: instance.id
			},
			create: {
				id: instance.id,
				repository_id: repositoryId,
				name: instance.name,
				location: {
					create: {
						file: instance.location.file,
						start: instance.location.start,
						end: instance.location.end
					}
				},
				definition: {
					connect: {
						id: instance.containingComponent.id
					}
				},
				version: INDEXING_VERSION
			},
			update: {
				id: instance.id,
				repository_id: repositoryId,
				name: instance.name,
				definition: {
					connect: {
						id: instance.containingComponent.id
					}
				},
				version: INDEXING_VERSION
			}
		});

		await prisma.componentAttribute.deleteMany({
			where: {
				component_id: instance.id
			}
		});
		try {
			await Promise.all(instance.attributes.map(attribute => prisma.componentAttribute.create({
				data: {
					name: attribute.name,
					type: attribute.type,
					value: attribute.value,
					component: {
						connect: {
							id: instance.id
						}
					},
					index: attribute.index,
					location: {
						create: {
							file: attribute.location.file,
							start: attribute.location.start,
							end: attribute.location.end
						}
					},
					reference_component: {
						connect: {
							id: attribute.reference.id
						}
					}
				}
			})));
		} catch(err) {
			console.log(err);
		}

		//await createElement(instance);
		onProgress && onProgress(i/elementInstances.length)
	}
}
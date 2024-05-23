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
import { ComponentAttribute } from "@harmony/db/lib/generated/client";

export type ReadFiles = (dirname: string, regex: RegExp, callback: (filename: string, content: string) => void) => Promise<void>;

export const indexFilesAndFollowImports = async (files: string[], readFile: (filepath: string) => Promise<string>, repositoryId: string) => {
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
	}
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
										} else if (attribute.type === 'property') {
											const name = getAttributeName(attribute);
											const value = getAttributeValue(newAttribute);

											newAttribute.value = `${name}:${value}`;
											newAttribute.type = 'property';
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
							const attributes = connectAttributesToParent(child.attributes, parent);
							const newElement = {...child, attributes, getParent: () => parent};
							elementInstances.push(newElement);

							return newElement;
						}

						function connectInstanceToChildren(element: ComponentElement): void {
							if (!element.isComponent) return;

							const binding = jsPath.scope.getBinding(element.name);
							let id: string | undefined;
							if (binding) {
								binding.path.traverse({
									FunctionDeclaration(path) {
										const location = getLocation(path.node, file);
										id = location ? getHashFromLocation(location, originalCode) : undefined;
									},
									ArrowFunctionExpression(path) {
										const location = getLocation(path.node, file);
										id = location ? getHashFromLocation(location, originalCode) : undefined;
									}
								})
							}

							const childElements = elementInstances.filter(instance => instance.containingComponent.id === id && instance.getParent() === undefined);
							childElements.forEach(child => {
								const newChild = connectChildToParent(child, element);
								connectInstanceToChildren(newChild);
							});
						}

						function connectInstanceToParent(element: ComponentElement): void {
							const parents = elementInstances.filter(parent => parent.id === element.containingComponent.id);
							parents.forEach(parent => {connectChildToParent(element, parent)});
						}

						//console.log(path);
						const parentElement = jsxElements.length > 0 ? jsxElements[jsxElements.length - 1] : undefined;
						const jsxElementDefinition = createJSXElementDefinition(jsPath.node, parentElement, containingComponent, file, originalCode);

						const parentComponent = containingComponent;
						
						if (jsxElementDefinition) {
							const createIdentifierAttribute = (node: t.Identifier, type: 'text' | 'className' | 'property', name: string | undefined): Attribute[] => {
								const value = node.name;
								const binding = value ? jsPath.scope.getBinding(value) : undefined;
								if (binding && ['const', 'let', 'var'].includes(binding.kind) && t.isVariableDeclarator(binding.path.node) && binding.path.node.init) {
									return createExpressionAttribute(binding.path.node.init, type, name)
								}

								if (!node.start || !node.end) throw new Error(`Invalid start and end for node ${node}`);
								const location: ComponentLocation = {
									file,
									start: node.start,
									end: node.end
								}
								return [{id: '', type, name: 'property', value: name ? `${name}:${value}` : value || '', reference: jsxElementDefinition, index: -1, location}];
							}
							const createParamAttribute = (params: t.Node[], type: 'text' | 'className' | 'property', name: string | undefined): Attribute[] => {
								const expressions = params.filter(param => t.isExpression(param)) as t.Expression[];
								const attributes: Attribute[] = expressions.map(expression => createExpressionAttribute(expression, type, name)).flat()

								return attributes;
							}
	
							const createExpressionAttribute = (node: t.Expression | t.JSXEmptyExpression, type: 'text' | 'className' | 'property', name: string | undefined): Attribute[] => {
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
								} else if (t.isIdentifier(node)) {
									return createIdentifierAttribute(node, type, name);
								}

								//If we get here, then we could not resolve to a static string.
								const value = undefined;
								if (!node.start || !node.end) throw new Error(`Invalid start and end for node ${node}`);
								const location: ComponentLocation = {
									file,
									start: node.start,
									end: node.end
								}
								return [{id: '', type, name: 'property', value: name ? `${name}:${value}` : value || 'undefined', reference: jsxElementDefinition, index: -1, location}];
							}
	
							const createStringAttribute = (node: t.StringLiteral | t.TemplateElement | t.JSXText, type: 'text' | 'className' | 'property', propertyName: string | undefined, value: string): Attribute => {
								if (!node.start || !node.end) throw new Error(`Invalid start and end for node ${node}`);
								const location: ComponentLocation = {
									file,
									start: node.start,
									end: node.end
								}
								return {id: '', type, name: 'string', value: type === 'className' || !propertyName ? value : `${propertyName}:${value}`, reference: jsxElementDefinition, index: -1, location}
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
										jsxElementDefinition.attributes.push(...createExpressionAttribute(attr.value.expression, type, String(attr.name.name)));
									}
								}
							}
							
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

function normalizeCodeInfo(componentDefinitions: Record<string, HarmonyComponent>, instances: ComponentElement[]) {
	const findAttributeLocation = (curr: ComponentElement, instance: ComponentElement, propertyName: string): {attribute: Attribute, reference: ComponentElement | HarmonyComponent} | undefined => {
		const attribute = curr.attributes.find(a => a.type === 'property' && a.value.split(':')[0] === propertyName || a.type === 'text' &&  propertyName === 'children');
		if (attribute) {
			if (attribute.name === 'string') {
				return {reference: curr, attribute};
				
			} else {
				const parent = curr.getParent();
				if (parent) {
					const reference = findAttributeLocation(parent, instance, propertyName);

					//TODO: find the text in the containing component
					// if (reference === undefined) {
					// 	return {reference: curr.containingComponent, attribute};
					// }

					return reference;
				}

				//TODO: find the text in the containing component
				//return {reference: curr.containingComponent, attribute}
			}
		}  

		return undefined;
	}

	const isComponentInstance = (instance: ComponentElement): boolean => {
		return instance.name[0] === instance.name[0].toUpperCase();
	}

	const connectInstanceToChildren = (instance: ComponentElement): void => {
		if (isComponentInstance(instance)) {
			const definition = componentDefinitions[instance.name];
			if (!definition) return;

			for (let i = 0; i < definition.children.length; i++) {
				const definitionInstance = definition.children[i];
				//definitionInstance.getParent = () => instance;
				const newInstance = {...definitionInstance, parentId: instance.id, getParent: () => instance};
				newInstance.attributes = definitionInstance.attributes.map(atr => ({...atr, reference: newInstance}))

				elementInstances.push(newInstance);
				//definition.children[i] = definitionInstance;
				connectInstanceToChildren(newInstance);
			}
			calledComponent.push(definition.name);
		}
	}

	const elementInstances: ComponentElement[] = [];
	const calledComponent: string[] = [];
	for (const instance of instances) {
		connectInstanceToChildren(instance);
	}

	//If a component has not been called, then that means it has no parent, so add that in
	for (const name in componentDefinitions) {
		if (!calledComponent.includes(name)) {
			elementInstances.push(...componentDefinitions[name].children);
		}
	}

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

	for (let i = 0; i < elementInstances.length; i++) {
		const instance = elementInstances[i];
		instance.id = getIdFromParents(instance);
		for (let j = 0; j < instance.attributes.length; j++) {
			const attribute = instance.attributes[j];
			if (attribute.type === 'text' && attribute.name === 'property') {
				const parent = instance.getParent();
				if (parent) {
					const results = findAttributeLocation(parent, instance, attribute.value);
					if (results) {
						attribute.reference = results.reference;
						attribute.name = results.attribute.name;
						attribute.value = results.attribute.value;

						if (attribute.name !== 'string') {
							throw new Error("Attribute should be a string!");
						}
						
						//For a string text property, we need to make sure the value is just the text. 
						//However, getting the info from a 'property' means the value is {name}:{value}. 
						//We must get rid of this and leave just {value}
						if (results.attribute.type === 'property' && attribute.type === 'text' && attribute.name === 'string') {
							const splitIndex = attribute.value.indexOf(':');
							if (splitIndex < 0) {
								throw new Error("Invalid property " + attribute.value);
							}

							attribute.value = attribute.value.substring(splitIndex + 1);
						}
					} else {
						//attribute.reference = instance.containingComponent;
						
						//For now, if we cannot find where to update the text in a string property then just 
						//delete the attribute so we can say 'We cannot updat the text'
						instance.attributes.splice(j, 1);
						j--;
					}
				}
			}
		}
	}

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
	const alreadyCreated: string[] = [];
	const createElement = async (instance: ComponentElement) => {
		if (alreadyCreated.includes(instance.id)) return;

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
					repository_id: repositoryId,
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
				repository_id: repositoryId,
				name: instance.name,
				location_id: locationId,
				definition_id: definition.id
			}
		});

		for (const attribute of instance.attributes) {
			//if (attribute.type === 'text') {
				let comp = !('id' in attribute.reference) ? await prisma.componentDefinition.findUnique({
					where: {
						name: attribute.reference.name
					}
				}) : await prisma.componentElement.findUnique({
					where: {
						id: attribute.reference.id,
					}
				});
				if (!comp) {
					if (!('id' in attribute.reference)) {
						const definition = attribute.reference as HarmonyComponent;
						comp = await prisma.componentDefinition.create({
							data: {
								name: definition.name,
								repository_id: repositoryId,
								location: {
									create: {
										file: definition.location.file,
										start: definition.location.start,
										end: definition.location.end
									}
								}
							}
						})
					} else {
						throw new Error("There was an error finding the component");
					}
				}

				await prisma.componentAttribute.create({
					data: {
						name: attribute.name,
						type: attribute.type,
						value: attribute.value,
						component_id: newElement.id, 
						index: attribute.index,
						location_id: comp?.location_id
					}
				})
			//}
		}
	} catch (err) {console.log(instance)}

		alreadyCreated.push(instance.id);
	}

	for (let i = 0; i < elementInstances.length; i++) {
		const instance = elementInstances[i];
		await createElement(instance);
		onProgress && onProgress(i/elementInstances.length)
	}
}
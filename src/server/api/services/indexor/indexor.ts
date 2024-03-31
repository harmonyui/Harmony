import { prisma } from "../../../../../src/server/db";
import { HarmonyComponent, ComponentElement, ComponentLocation, Attribute } from "../../../../../packages/ui/src/types/component";
import { getLineAndColumn, hashComponentId } from "../../../../../packages/util/src/index";
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import path from 'node:path';

export type ReadFiles = (dirname: string, regex: RegExp, callback: (filename: string, content: string) => void) => Promise<void>;

export const indexFilesAndFollowImports = async (files: string[], readFile: (filepath: string) => Promise<string>, repositoryId: string) => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const instances: ComponentElement[] = [];
	const importDeclarations: Record<string, {name: string, path: string}> = {};
	const visitedFiles: Set<string> = new Set();

	const visitPaths = async (filepath: string) => {
		if (visitedFiles.has(filepath)) return;

		visitedFiles.add(filepath);
		const content = await readFile(filepath);
		getCodeInfoFromFile(filepath, content, componentDefinitions, instances, importDeclarations);
		// for (const componentName in importDeclarations) {
		// 	const {path: importPath, name} = importDeclarations[componentName];
		// 	const fullPath = path.join(filepath, importPath);
		// 	await visitPaths(fullPath);
		// }
	}

	for (const filepath of files) {
		await visitPaths(filepath);	
	}

	await normalizeCodeInfoAndUpdateDatabase(componentDefinitions, instances, repositoryId);
}

export const indexCodebase = async (dirname: string, fromDir: ReadFiles, repoId: string, onProgress?: (progress: number) => void) => {
	const componentDefinitions: Record<string, HarmonyComponent> = {};
	const instances: ComponentElement[] = [];

	await fromDir(dirname, /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(js|ts|tsx|jsx)$/, (filename, content) => {
		getCodeInfoFromFile(filename, content, componentDefinitions, instances, {});
	});

	await normalizeCodeInfoAndUpdateDatabase(componentDefinitions, instances, repoId, onProgress);
}

function getCodeInfoFromFile(file: string, originalCode: string, componentDefinitions: Record<string, HarmonyComponent>, elementInstances: ComponentElement[], importDeclarations: Record<string, {name: string, path: string}>): boolean {
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

		return hashComponentId({file, startColumn, startLine, endColumn, endLine});
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
						//console.log(path);
						const parentElement = jsxElements.length > 0 ? jsxElements[jsxElements.length - 1] : undefined;
						const jsxElementDefinition = createJSXElementDefinition(jsPath.node, parentElement, containingComponent, file, originalCode);
			
						const parentComponent = containingComponent;
						if (jsxElementDefinition) {
							const node = jsPath.node;
							const nonWhiteSpaceChildren = node.children.filter(n => !t.isJSXText(n) || n.value.trim().length > 0);
							if (nonWhiteSpaceChildren.length === 1) {
								const child = nonWhiteSpaceChildren[0];
								if (t.isJSXText(child)) {
									jsxElementDefinition.attributes.push({id: '', type: 'text', name: 'string', value: child.extra?.raw as string || child.value, reference: jsxElementDefinition})
								} else if (t.isJSXExpressionContainer(child)) {
									const value = t.isIdentifier(child.expression) ? child.expression.name : '';
									jsxElementDefinition.attributes.push({id: '', type: 'text', name: 'property', value, reference: jsxElementDefinition});
								}
							}
							for (const attr of node.openingElement.attributes) {
								if (t.isJSXAttribute(attr)) {
									const type = attr.name.name === 'className' ? 'className' : 'property';
									if (t.isStringLiteral(attr.value)) {
										jsxElementDefinition.attributes.push({id: '', type, name: 'string', value: type === 'className' ? attr.value.value : `${attr.name.name}:${attr.value.value}`, reference: jsxElementDefinition});
									} else if (t.isJSXExpressionContainer(attr.value)) {
										const value = t.isIdentifier(attr.value.expression) ? attr.value.expression.name : undefined;
										jsxElementDefinition.attributes.push({id: '', type, name: 'property', value: `${attr.name.name}:${value}`, reference: jsxElementDefinition});
									}
								}
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
	return String(Math.random()).hashCode().toString();
}

const normalizeCodeInfoAndUpdateDatabase = async (componentDefinitions: Record<string, HarmonyComponent>, instances: ComponentElement[], repositoryId: string, onProgress?: (progress: number) => void) => {
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
				const newInstance = {...definitionInstance, parentId: instance.id, getParent: () => instance};
				newInstance.attributes = definitionInstance.attributes.map(atr => ({...atr, reference: newInstance}))

				elementInstances.push(newInstance);
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
				repository_id: repositoryId,
				name: instance.name,
				parent_id: parent?.id || '',
				parent_parent_id: parent?.parentId || null,
				location_id: locationId,
				definition_id: definition.id
			}
		});

		for (const attribute of instance.attributes) {
			//if (attribute.type === 'text') {
				let comp = !('parentId' in attribute.reference) ? await prisma.componentDefinition.findUnique({
					where: {
						name: attribute.reference.name
					}
				}) : await prisma.componentElement.findUnique({
					where: {
						id_parent_id: {
							id: attribute.reference.id,
							parent_id: attribute.reference.parentId
						}
					}
				});
				if (!comp) {
					if (!('parentId' in attribute.reference)) {
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
						component_parent_id: newElement.parent_id,
						location_id: comp?.location_id
					}
				})
			//}
		}
	} catch (err) {console.log(instance)}

		alreadyCreated.push(`${instance.id}${instance.parentId}`);
	}

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
	for (let i = 0; i < elementInstances.length; i++) {
		const instance = elementInstances[i];
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
		await createElement(instance);
		onProgress && onProgress(i/elementInstances.length)
	}
}
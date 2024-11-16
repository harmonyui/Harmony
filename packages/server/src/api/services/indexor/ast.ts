import { parse } from '@babel/parser'
import type { NodePath } from '@babel/traverse'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { ComponentLocation } from '@harmony/util/src/types/component'
import {
  getLineAndColumn,
  hashComponentId,
} from '@harmony/util/src/utils/component'
import { getSnippetFromNode } from '../publish/code-updator'
import type {
  Attribute,
  AttributeNode,
  ComponentNode,
  ElementNode,
  HarmonyComponent,
  HarmonyContainingComponent,
  Node,
  PropertyNode,
} from './types'

const getHashFromLocation = (
  location: ComponentLocation,
  codeSnippet: string,
): string => {
  const { file: _file, start, end } = location
  const { line: startLine, column: startColumn } = getLineAndColumn(
    codeSnippet,
    start,
  )
  const { line: endLine, column: endColumn } = getLineAndColumn(
    codeSnippet,
    end,
  )

  return hashComponentId([
    { file: _file, startColumn, startLine, endColumn, endLine },
  ])
}

export function getAttributeName(attribute: Attribute): string {
  if (attribute.type === 'className') {
    return 'className'
  } else if (attribute.type === 'text') {
    return 'children'
  }

  const [name] = attribute.value.split(':')
  return name
}

export function getPropertyName(attribute: Attribute): string | undefined {
  if (attribute.name !== 'property') return undefined

  if (attribute.type === 'text') {
    return attribute.value === 'undefined' ? undefined : attribute.value
  }

  const [_, propertyName] = attribute.value.split(':')
  return propertyName === 'undefined' ? undefined : propertyName
}

export function getAttributeValue(attribute: Attribute): string {
  if (attribute.name === 'property') {
    return getPropertyName(attribute) || 'undefined'
  }

  if (attribute.type === 'property') {
    const [_, ...propertyValue] = attribute.value.split(':')
    return propertyValue.join(':')
  }

  return attribute.value
}

export function getPropertyValue(property: PropertyNode): string[] {
  if (isLiteralNode(property.node)) {
    return getLiteralValue(property.node).split('')
  }

  return property.next.map((property) => {
    if (property) getPropertyValues(property.next)
  })
}

export function getPropertyValues(properties: PropertyNode[]): string[][] {
  return properties.map((property) => getPropertyValue(property))
}

export type LiteralNode = t.JSXText | t.StringLiteral | t.TemplateElement
export const isLiteralNode = (
  node: t.Node | undefined,
): node is LiteralNode => {
  return (
    t.isJSXText(node) || t.isStringLiteral(node) || t.isTemplateElement(node)
  )
}

export const getLiteralValue = (node: LiteralNode): string => {
  if (typeof node.value === 'string') {
    return node.value
  }

  return node.value.raw
}

export function getCodeInfoFromFile(
  file: string,
  originalCode: string,
  componentDefinitions: Record<string, HarmonyContainingComponent>,
  elementInstances: ElementNode[],
  importDeclarations: Record<string, { name: string; path: string }>,
): boolean {
  const ast = parse(originalCode, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  const getNameFromNode = (
    name: t.JSXIdentifier | t.JSXMemberExpression | t.JSXNamespacedName,
  ): string => {
    if (name.type === 'JSXIdentifier') {
      return name.name
    }

    if (name.type === 'JSXMemberExpression') {
      return `${getNameFromNode(name.object)}.${getNameFromNode(name.property)}`
    }

    return `${getNameFromNode(name.namespace)}.${getNameFromNode(name.name)}`
  }

  function getLocation(node: t.Node, _file: string) {
    if (!node.loc) {
      return undefined
    }

    return {
      file: _file,
      start: node.loc.start.index,
      end: node.loc.end.index,
    }
  }

  function createJSXElementDefinition(
    node: t.JSXElement,
    parentElement: HarmonyComponent | undefined,
    containingComponent: HarmonyContainingComponent,
    path: string,
    snippet: string,
  ): HarmonyComponent | undefined {
    const name = getNameFromNode(node.openingElement.name)
    const isComponent = name[0].toLowerCase() !== name[0]
    const location = getLocation(node, path)
    if (location === undefined) {
      return undefined
    }
    const id = getHashFromLocation(location, snippet)

    return {
      id,
      name,
      getParent() {
        return undefined
      },
      children: [],
      isComponent,
      location,
      props: [],
      containingComponent,
      node,
    }
  }

  traverse(ast, {
    ImportDeclaration(path) {
      const importPath = path.node.source.value
      for (const specifier of path.node.specifiers) {
        if (specifier.type === 'ImportSpecifier') {
          const name =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value
          const localName = specifier.local.name
          importDeclarations[localName] = { path: importPath, name }
        } else if (specifier.type === 'ImportDefaultSpecifier') {
          const name = 'default'
          const localName = specifier.local.name
          importDeclarations[localName] = { path: importPath, name }
        } else {
          //TODO: Deal with namespace import
        }
      }
    },
    'FunctionDeclaration|ArrowFunctionExpression'(path) {
      const jsxElements: HarmonyComponent[] = []
      const location = getLocation(path.node, file)

      if (location === undefined) {
        throw new Error('Cannot find location')
      }

      const containingComponent: HarmonyContainingComponent = {
        id: getHashFromLocation(location, originalCode),
        name: '',
        children: [],
        props: [],
        isComponent: true,
        location,
        getParent: () => undefined,
        node: path.node as t.FunctionDeclaration | t.ArrowFunctionExpression,
      }

      // Visitor for extracting JSX elements within the function body
      path.traverse({
        JSXElement: {
          enter(jsPath) {
            function connectAttributesToParent(
              elementAttributes: Attribute[],
              parent: HarmonyComponent,
            ): Attribute[] {
              const attributes: Attribute[] = []
              const addedFromParents: Attribute[] = []
              for (const attribute of elementAttributes) {
                const propertyName = getPropertyName(attribute)
                if (propertyName) {
                  const filtered = parent.props.filter(
                    (attr) => getAttributeName(attr) === propertyName,
                  )
                  const sameAttributesInElement = filtered.map((attr) => {
                    const newAttribute = { ...attr }
                    if (attribute.type === 'text') {
                      newAttribute.value = getAttributeValue(newAttribute)
                      //The text index needs to be accurate, and if this new attribute is not a text then
                      //it is -1, which is not accurate
                      if (newAttribute.type !== 'text') {
                        newAttribute.index = attribute.index
                      } else {
                        //When there are multiple layers with multiple text attributes,
                        //the index needs to be accurate.
                        //Look at test case 'Should keep parent index of text element'
                        newAttribute.index += attribute.index
                      }
                      newAttribute.type = 'text'
                    } else if (attribute.type === 'property') {
                      const name = getAttributeName(attribute)
                      const value = getAttributeValue(newAttribute)

                      newAttribute.value = `${name}:${value}`
                      newAttribute.type = 'property'
                    } else {
                      const value = getAttributeValue(newAttribute)
                      newAttribute.value =
                        newAttribute.name === 'property'
                          ? `className:${value}`
                          : value
                      newAttribute.type = 'className'
                    }
                    return newAttribute
                  })
                  addedFromParents.push(...filtered)

                  //If there is a props className attribute but the parent doesn't have a className attribute already applied to it, then add it
                  //on to the parent.
                  if (
                    attribute.type === 'className' &&
                    attribute.locationType === 'props' &&
                    sameAttributesInElement.length === 0
                  ) {
                    if (!parent.node.openingElement.loc) {
                      throw new Error('Invalid location')
                    }
                    const { end, start } = parent.node.openingElement.loc
                    //Even though this is type string, we need to know what the name of the class is we are adding, so we set that as the attribute value
                    sameAttributesInElement.push({
                      ...attribute,
                      reference: parent,
                      name: 'string',
                      value: getAttributeValue(attribute),
                      locationType: 'add',
                      location: {
                        file: parent.location.file,
                        start: start.index,
                        end: end.index,
                      },
                      node: parent.node.openingElement,
                    })
                  }
                  //If we have some things to add, cheerio!
                  if (sameAttributesInElement.length > 0) {
                    attributes.push(...sameAttributesInElement)
                  }
                  //Otherwise just add this attribute
                }
                attributes.push({ ...attribute })
              }

              //If the child has a spread attribute, lets pull down every attribute from the parent that has not been already
              //connected
              if (
                elementAttributes.find(
                  (attr) =>
                    getAttributeName(attr) === 'harmony-spread' &&
                    attr.locationType === 'props',
                )
              ) {
                const parentAttributesNotAlreadyAdded = parent.props.filter(
                  (parentProp) => !addedFromParents.includes(parentProp),
                )
                attributes.push(...parentAttributesNotAlreadyAdded)
                //If one of the parent's attribute doesn't include children, we can add that one
                if (
                  !attributes.find(
                    (attribute) =>
                      attribute.type === 'className' &&
                      attribute.reference === parent,
                  )
                ) {
                  if (!parent.node.openingElement.loc) {
                    throw new Error('Invalid location')
                  }
                  const { start, end } = parent.node.openingElement.loc
                  //Even though this is type string, we need to know what the name of the class is we are adding, so we set that as the attribute value
                  attributes.push({
                    id: '',
                    type: 'className',
                    index: -1,
                    reference: parent,
                    name: 'string',
                    value: 'className',
                    locationType: 'add',
                    location: {
                      file: parent.location.file,
                      start: start.index,
                      end: end.index,
                    },
                    node: parent.node.openingElement,
                  })
                }
              }

              return attributes
            }

            function connectChildToParent(
              child: HarmonyComponent,
              parent: HarmonyComponent,
            ): HarmonyComponent {
              const recurseConnectLog = (el: HarmonyComponent): string => {
                const _parent = el.getParent()
                if (_parent) {
                  return `to ${_parent.name} ${recurseConnectLog(_parent)}`
                }
                return ''
              }
              process.env.NODE_ENV === 'development' &&
                console.log(
                  `Connecting ${child.name} to ${parent.name} ${recurseConnectLog(parent)}`,
                )
              const props = connectAttributesToParent(child.props, parent)
              const newElement: HarmonyComponent = {
                ...child,
                props,
                getParent: () => parent,
              }
              elementInstances.push(newElement)

              return newElement
            }

            function getComponentsBindingId(
              element: HarmonyComponent,
            ): string | undefined {
              if (!element.isComponent) return

              const getId = (node: t.Node): string | undefined => {
                const _location = getLocation(node, file)
                return _location
                  ? getHashFromLocation(_location, originalCode)
                  : undefined
              }

              const binding = jsPath.scope.getBinding(element.name)
              let id: string | undefined
              if (binding) {
                if (
                  t.isFunctionDeclaration(binding.path.node) ||
                  t.isArrowFunctionExpression(binding.path.node)
                ) {
                  id = getId(binding.path.node)
                } else {
                  binding.path.traverse({
                    FunctionDeclaration(_path) {
                      if (id) return
                      const _location = getLocation(_path.node, file)
                      id = _location
                        ? getHashFromLocation(_location, originalCode)
                        : undefined
                    },
                    ArrowFunctionExpression(_path) {
                      if (id) return
                      const _location = getLocation(_path.node, file)
                      id = _location
                        ? getHashFromLocation(_location, originalCode)
                        : undefined
                    },
                  })
                }
              }
              if (!id) {
                const definition = componentDefinitions[element.name] as
                  | HarmonyContainingComponent
                  | undefined
                id = definition?.id
              }

              return id
            }

            function connectInstanceToChildren(
              element: HarmonyComponent,
            ): void {
              const id = getComponentsBindingId(element)

              const childElements = elementInstances.filter(
                (instance) =>
                  instance.name !== element.name &&
                  instance.containingComponent?.id === id &&
                  instance.getParent() === undefined,
              )
              childElements.forEach((child) => {
                const newChild = connectChildToParent(child, element)
                connectInstanceToChildren(newChild)
              })
            }

            function connectInstanceToParent(element: HarmonyComponent): void {
              const bindings: Record<string, string | undefined> = {}
              const parents = elementInstances.filter((parent) => {
                let binding = bindings[parent.name]
                if (!binding) {
                  bindings[parent.name] = getComponentsBindingId(parent)
                  binding = bindings[parent.name]
                }
                return binding === element.containingComponent?.id
              })
              const newChildren = parents.map((parent) => {
                return connectChildToParent(element, parent)
                //connectInstanceToParent(parent);
              })
              newChildren.forEach((newChild) => {
                connectInstanceToChildren(newChild)
              })
            }

            const parentElement =
              jsxElements.length > 0
                ? jsxElements[jsxElements.length - 1]
                : undefined
            const jsxElementDefinition = createJSXElementDefinition(
              jsPath.node,
              parentElement,
              containingComponent,
              file,
              originalCode,
            )

            const parentComponent = containingComponent

            type AttributeType = 'text' | 'className' | 'property'

            if (jsxElementDefinition) {
              const createPropertyAttribute = (
                node: t.Node,
                type: AttributeType,
                name: string | undefined,
                propertyName: string | undefined,
                locationType: string,
              ): Attribute => {
                if (!node.start || !node.end)
                  throw new Error(
                    `Invalid start and end for node ${String(node)}`,
                  )
                const _location: ComponentLocation = {
                  file,
                  start: node.start,
                  end: node.end,
                }
                return createAttribute(
                  type,
                  'property',
                  name,
                  propertyName,
                  locationType,
                  _location,
                  node,
                )
              }
              const createIdentifierAttribute = (
                node: t.Identifier,
                type: AttributeType,
                name: string | undefined,
              ): Attribute[] => {
                const value = node.name
                const binding = jsPath.scope.getBinding(value)
                const getAttributes = (
                  _node: t.Node,
                  values: Attribute[],
                ): Attribute[] => {
                  if (t.isIdentifier(_node)) {
                    return values
                  } else if (t.isObjectPattern(_node)) {
                    const property = _node.properties.find(
                      (prop) =>
                        t.isObjectProperty(prop) &&
                        t.isIdentifier(prop.value) &&
                        prop.value.name === value,
                    ) as t.ObjectProperty | undefined
                    const _getPropertyName = () => {
                      if (!property) return value

                      if (
                        t.isIdentifier(property.key) &&
                        property.key.name === value
                      )
                        return value

                      //If we are looking at something like {param: _param} where our identifier value is _param, then the property name is param
                      if (
                        t.isIdentifier(property.key) &&
                        t.isIdentifier(property.value) &&
                        property.value.name === value &&
                        !property.computed
                      )
                        return property.key.name

                      const propertyAttribute = t.isExpression(property.key)
                        ? createExpressionAttribute(property.key, type, name)
                        : []
                      const propertyName =
                        propertyAttribute.length === 1
                          ? getAttributeValue(propertyAttribute[0])
                          : ''

                      return propertyName
                    }

                    const propertyName = _getPropertyName()
                    const attributes = createAttributeFromObjects(
                      node,
                      values,
                      type,
                      name,
                      propertyName,
                    )
                    if (attributes.length) {
                      return attributes
                    }
                  }

                  return values
                }
                if (
                  binding &&
                  ['const', 'let', 'var'].includes(binding.kind) &&
                  t.isVariableDeclarator(binding.path.node) &&
                  binding.path.node.init
                ) {
                  const idValues = createExpressionAttribute(
                    binding.path.node.init,
                    type,
                    name,
                  )
                  return getAttributes(binding.path.node.id, idValues)
                }

                if (binding && binding.kind === 'param') {
                  const values = [
                    createPropertyAttribute(node, type, name, 'props', 'props'),
                  ]
                  return getAttributes(binding.path.node, values)
                }

                return [
                  createPropertyAttribute(node, type, name, value, 'component'),
                ]
              }

              const createAttributeFromObjects = (
                node: t.Node,
                objectAttributes: Attribute[],
                type: AttributeType,
                name: string | undefined,
                propertyName: string,
              ): Attribute[] => {
                const attributes: Attribute[] = []
                for (const attribute of objectAttributes) {
                  const attrName = getAttributeName(attribute)
                  const attrValue = getAttributeValue(attribute)
                  if (attrValue === 'props') {
                    attributes.push(
                      createPropertyAttribute(
                        node,
                        type,
                        name,
                        propertyName,
                        'props',
                      ),
                    )
                  } else if (attrName === propertyName) {
                    const value = getAttributeValue(attribute)
                    const newAttribute = createAttribute(
                      type,
                      attribute.name,
                      name,
                      value,
                      attribute.locationType,
                      attribute.location,
                      attribute.node,
                    )
                    attributes.push(newAttribute)
                  }
                }

                return attributes
              }

              const createMemberExpressionAttribute = (
                node: t.MemberExpression,
                type: AttributeType,
                name: string | undefined,
              ): Attribute[] => {
                if (
                  t.isIdentifier(node.object) &&
                  t.isExpression(node.property)
                ) {
                  const objectAttributes = createIdentifierAttribute(
                    node.object,
                    type,
                    name,
                  )
                  const _getPropertyName = () => {
                    //If this property is computed, then evaulate the expression
                    if (node.computed) {
                      const propertyAttributes = createExpressionAttribute(
                        node.property as t.Expression,
                        type,
                        name,
                      )
                      const propertyName =
                        propertyAttributes.length === 1
                          ? getAttributeValue(propertyAttributes[0])
                          : ''
                      return propertyName
                    }

                    //If it's not computed, just get the name of the property
                    if (t.isIdentifier(node.property)) {
                      return node.property.name
                    }

                    return ''
                  }
                  const propertyName = _getPropertyName()
                  const attributes = createAttributeFromObjects(
                    node,
                    objectAttributes,
                    type,
                    name,
                    propertyName,
                  )
                  if (attributes.length) {
                    return attributes
                  }
                }

                return [
                  createPropertyAttribute(
                    node,
                    type,
                    name,
                    undefined,
                    'component',
                  ),
                ]
              }

              const createObjectPropertiesAttribute = (
                properties: t.Node[],
              ): Attribute[] => {
                const attributes: Attribute[] = []
                for (const property of properties) {
                  if (
                    t.isObjectProperty(property) &&
                    t.isIdentifier(property.key) &&
                    t.isExpression(property.value)
                  ) {
                    const attrs = createExpressionAttribute(
                      property.value,
                      'property',
                      property.key.name,
                    )
                    attributes.push(
                      ...attrs.map((attr) => {
                        const _name = getAttributeName(attr)
                        const value = getAttributeValue(attr)
                        return createAttribute(
                          attr.type as AttributeType,
                          attr.name,
                          _name,
                          value,
                          attr.locationType,
                          attr.location,
                          attr.node,
                        )
                      }),
                    )
                  }
                }

                return attributes
              }

              const createObjectExpressionAttribute = (
                node: t.ObjectExpression,
              ): Attribute[] => {
                return createObjectPropertiesAttribute(node.properties)
              }

              const createLogicalExpressionAttribute = (
                node: t.LogicalExpression,
                type: AttributeType,
                name: string | undefined,
              ): Attribute[] => {
                if (type === 'text')
                  return [
                    createPropertyAttribute(
                      node,
                      type,
                      name,
                      undefined,
                      'component',
                    ),
                  ]
                return [
                  ...createExpressionAttribute(node.left, type, name),
                  ...createExpressionAttribute(node.right, type, name),
                ]
              }

              const createParamAttribute = (
                params: t.Node[],
                type: AttributeType,
                name: string | undefined,
              ): Attribute[] => {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- ok
                const expressions = params.filter((param) =>
                  t.isExpression(param),
                ) as t.Expression[]
                const attributes: Attribute[] = expressions
                  .map((expression) =>
                    createExpressionAttribute(expression, type, name),
                  )
                  .flat()

                return attributes
              }

              const createExpressionAttribute = (
                node: t.Expression | t.JSXEmptyExpression,
                type: AttributeType,
                name: string | undefined,
              ): Attribute[] => {
                if (t.isStringLiteral(node)) {
                  return [createStringAttribute(node, type, name, node.value)]
                } else if (t.isCallExpression(node)) {
                  const params = node.arguments
                  const attributes = createParamAttribute(params, type, name)
                  if (attributes.length) {
                    return attributes
                  }

                  return [
                    createPropertyAttribute(
                      node,
                      type,
                      name,
                      undefined,
                      'component',
                    ),
                  ]
                } else if (t.isTemplateLiteral(node)) {
                  const expressions = [
                    ...node.expressions,
                    ...node.quasis,
                  ].sort((a, b) => (a.start || 0) - (b.start || 0))
                  const attributes = expressions
                    .map<Attribute[]>((expression) => {
                      if (
                        t.isTemplateElement(expression) &&
                        expression.value.raw
                      ) {
                        return [
                          createStringAttribute(
                            expression,
                            type,
                            name,
                            expression.value.raw,
                          ),
                        ]
                      } else if (t.isExpression(expression)) {
                        return createParamAttribute([expression], type, name)
                      }

                      return []
                    })
                    .flat()
                  if (attributes.length) {
                    return attributes
                  }

                  return [
                    createPropertyAttribute(
                      node,
                      type,
                      name,
                      undefined,
                      'component',
                    ),
                  ]
                } else if (t.isMemberExpression(node)) {
                  return createMemberExpressionAttribute(node, type, name)
                } else if (t.isObjectExpression(node)) {
                  return createObjectExpressionAttribute(node)
                } else if (t.isLogicalExpression(node)) {
                  return createLogicalExpressionAttribute(node, type, name)
                } else if (t.isIdentifier(node)) {
                  return createIdentifierAttribute(node, type, name)
                }

                //If we get here, then we could not resolve to a static string.
                return [
                  createPropertyAttribute(
                    node,
                    type,
                    name,
                    undefined,
                    'component',
                  ),
                ]
              }

              const createStringAttribute = (
                node: LiteralNode,
                type: AttributeType,
                propertyName: string | undefined,
                value: string,
              ): Attribute => {
                if (!node.start || !node.end)
                  throw new Error(
                    `Invalid start and end for node ${String(node)}`,
                  )
                const _location: ComponentLocation = {
                  file,
                  start: node.start,
                  end: node.end,
                }
                return createAttribute(
                  type,
                  'string',
                  propertyName,
                  value,
                  'component',
                  _location,
                  node,
                )
              }

              const createAttribute = (
                type: AttributeType,
                name: string,
                propertyName: string | undefined,
                value: string | undefined,
                locationType: string,
                _location: ComponentLocation,
                node: Attribute['node'],
              ): Attribute => {
                //For className attributes in the props, only include them as className if it has class in the name
                //in order to filter out properties that don't have classes (see app/classNameTests.tsx for more details)
                if (
                  type === 'className' &&
                  locationType === 'props' &&
                  !propertyName?.toLowerCase().includes('class')
                ) {
                  return createAttribute(
                    'property',
                    name,
                    propertyName,
                    value,
                    locationType,
                    _location,
                    node,
                  )
                }

                if (name === 'string') {
                  return {
                    id: '',
                    type,
                    name: 'string',
                    value:
                      type === 'className' || !propertyName
                        ? value || ''
                        : `${propertyName}:${value}`,
                    reference: jsxElementDefinition,
                    index: -1,
                    location: _location,
                    locationType,
                    node,
                  }
                }

                return {
                  id: '',
                  type,
                  name: 'property',
                  value: propertyName
                    ? `${propertyName}:${value}`
                    : value || 'undefined',
                  reference: jsxElementDefinition,
                  index: -1,
                  location: _location,
                  locationType,
                  node,
                }
              }

              const node = jsPath.node
              const textAttributes: Attribute[] = []
              const nonWhiteSpaceChildren = node.children.filter(
                (n) => !t.isJSXText(n) || n.value.trim().length > 0,
              )
              for (let i = 0; i < nonWhiteSpaceChildren.length; i++) {
                const child = nonWhiteSpaceChildren[i]
                if (t.isJSXText(child)) {
                  textAttributes.push({
                    ...createStringAttribute(
                      child,
                      'text',
                      undefined,
                      (child.extra?.raw as string) || child.value,
                    ),
                    index: i,
                  })
                } else if (t.isJSXExpressionContainer(child)) {
                  textAttributes.push({
                    ...createExpressionAttribute(
                      child.expression,
                      'text',
                      undefined,
                    )[0],
                    index: i,
                  })
                }
              }
              jsxElementDefinition.props.push(...textAttributes)
              for (const attr of node.openingElement.attributes) {
                if (t.isJSXAttribute(attr)) {
                  const type =
                    attr.name.name === 'className' ? 'className' : 'property'
                  if (t.isStringLiteral(attr.value)) {
                    jsxElementDefinition.props.push(
                      createStringAttribute(
                        attr.value,
                        type,
                        String(attr.name.name),
                        attr.value.value,
                      ),
                    )
                  } else if (t.isJSXExpressionContainer(attr.value)) {
                    jsxElementDefinition.props.push(
                      ...createExpressionAttribute(
                        attr.value.expression,
                        type,
                        String(attr.name.name),
                      ).map((expression) =>
                        createAttribute(
                          type,
                          expression.name,
                          getAttributeName(expression),
                          getAttributeValue(expression),
                          expression.locationType,
                          expression.location,
                          expression.node,
                        ),
                      ),
                    )
                  }
                } else if (
                  t.isJSXSpreadAttribute(attr) &&
                  t.isIdentifier(attr.argument)
                ) {
                  const prop = createIdentifierAttribute(
                    attr.argument,
                    'property',
                    'harmony-spread',
                  )[0] as Attribute | undefined
                  prop &&
                    jsxElementDefinition.props.push(
                      createAttribute(
                        'property',
                        prop.name,
                        getAttributeName(prop),
                        getAttributeValue(prop),
                        prop.locationType,
                        prop.location,
                        prop.node,
                      ),
                    )
                }
              }

              //If this is a native html element and there is not className props, then we want the ability to add one
              let defaultClassName: Attribute | undefined
              if (
                !jsxElementDefinition.isComponent &&
                !jsxElementDefinition.props.find(
                  (attr) => attr.type === 'className',
                )
              ) {
                if (!node.openingElement.loc) {
                  throw new Error('Invalid location')
                }
                const { end, start } = node.openingElement.loc
                defaultClassName = createAttribute(
                  'className',
                  'string',
                  undefined,
                  '',
                  'add',
                  { file, start: start.index, end: end.index },
                  node.openingElement,
                )
                jsxElementDefinition.props.push(defaultClassName)
              }

              //console.log(`Adding ${jsxElementDefinition.name}`);
              jsxElements.forEach((element) => {
                element.children.push(jsxElementDefinition)
              })
              jsxElements.push(jsxElementDefinition)
              elementInstances.push(jsxElementDefinition)
              parentComponent.children.push(jsxElementDefinition)

              connectInstanceToChildren(jsxElementDefinition)
              connectInstanceToParent(jsxElementDefinition)
            }
          },
          exit() {
            jsxElements.pop()
          },
        },
      })

      containingComponent.name = getComponentName(
        containingComponent,
        path,
        'children',
      )
      componentDefinitions[containingComponent.name] = containingComponent
    },
  })

  return true
}

const getComponentName = <Key extends string>(
  component: { [key in Key]: unknown[] },
  path: NodePath,
  key: Key,
): string => {
  // Only consider functions with JSX elements as potential React components
  if (component[key].length > 0) {
    // Check if the function is assigned to a variable or exported
    if (t.isVariableDeclarator(path.parent) && t.isIdentifier(path.parent.id)) {
      return path.parent.id.name
    } else if (
      t.isExportDeclaration(path.parent) &&
      path.parent.type !== 'ExportAllDeclaration' &&
      path.parent.declaration &&
      'id' in path.parent.declaration &&
      t.isIdentifier(path.parent.declaration.id)
    ) {
      return path.parent.declaration.id.name
    } else if (
      t.isFunctionDeclaration(path.node) &&
      t.isIdentifier(path.node.id)
    ) {
      return path.node.id.name
    } else if (
      t.isCallExpression(path.parent) &&
      t.isVariableDeclarator(path.parentPath?.parent) &&
      t.isIdentifier(path.parentPath.parent.id)
    ) {
      return path.parentPath.parent.id.name
    }
  }
  return 'AnonymousComponent'
}

function getLocation(node: t.Node, _file: string) {
  if (!node.loc) {
    return undefined
  }

  return {
    file: _file,
    start: node.loc.start.index,
    end: node.loc.end.index,
  }
}

export const createGraph = (file: string, code: string) => {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  })

  const graph = new ASTGraph(ast.program)
  traverse(ast, {
    'ArrowFunctionExpression|FunctionDeclaration'(path) {
      if (
        !t.isArrowFunctionExpression(path.node) &&
        !t.isFunctionDeclaration(path.node)
      ) {
        return
      }
      const location = getLocation(path.node, file)
      if (!location) return

      const elements: ElementNode[] = []
      const componentNode: ComponentNode = {
        change: 'none',
        children: [],
        elements,
        location,
        name: '',
        path,
        node: path.node,
        parents: [],
        props: [],
      }

      const getNameFromExpression = (
        node: t.JSXExpressionContainer | t.JSXText,
      ): string | undefined => {
        if (
          t.isJSXExpressionContainer(node) &&
          t.isIdentifier(node.expression)
        ) {
          return node.expression.name
        }

        return undefined
      }

      path.traverse({
        JSXElement(elementPath) {
          const elementLocation = getLocation(elementPath.node, file)
          if (!elementLocation) return
          const attributes: AttributeNode[] = []
          const elementNode: ElementNode = {
            id: getHashFromLocation(elementLocation, code),
            attributes,
            location: elementLocation,
            next: [],
            prev: [],
            path: elementPath,
            node: elementPath.node,
            parent: componentNode,
            change: 'none',
            name: t.isJSXIdentifier(elementPath.node.openingElement.name)
              ? elementPath.node.openingElement.name.name
              : '',
          }

          elementPath.traverse({
            JSXAttribute(attrPath) {
              const attributeLocation = getLocation(attrPath.node, file)
              if (!attributeLocation) return

              const attribute: AttributeNode = {
                change: 'none',
                index: attributes.length,
                location: attributeLocation,
                name: t.isJSXExpressionContainer(attrPath.node.value)
                  ? (getNameFromExpression(attrPath.node.value) ?? '')
                  : '',
                parent: elementNode,
                next: [],
                prev: [],
                properties: [],
                path: attrPath,
                node: attrPath.node,
              }
              attributes.push(attribute)
            },
          })

          elementPath.node.children.forEach((child, i) => {
            if (t.isJSXExpressionContainer(child) || t.isJSXText(child)) {
              const textLocation = getLocation(child, file)
              if (!textLocation) return

              const childNode = elementPath.get(`children.${i}`) as NodePath
              const textNode: AttributeNode = {
                index: attributes.length,
                properties: [],
                location: textLocation,
                next: [],
                prev: [],
                path: childNode,
                node: childNode.node,
                parent: elementNode,
                change: 'none',
                name: getNameFromExpression(child) ?? 'children',
              }

              attributes.push(textNode)
            }
          })

          elements.push(elementNode)
        },
      })

      componentNode.name = getComponentName(componentNode, path, 'elements')
      graph.addComponent(componentNode)
    },
  })

  return graph
}

export class ASTGraph {
  private components = new Map<string, ComponentNode>()
  private nodeCreator = new NodeCreator()

  constructor(private program: t.Program) {}

  // Add a new component to the graph
  public addComponent(component: ComponentNode) {
    this.components.set(component.name, component)
  }

  // Get a component by name
  public getComponent(name: string): ComponentNode | undefined {
    return this.components.get(name)
  }

  public getElement(id: string): ElementNode | undefined {
    for (const component of Array.from(this.components.values())) {
      const element = component.elements.find((el) => el.id === id)
      if (element) return element
    }

    return undefined
  }

  // Add a JSX element to a component
  public addJSXElement(componentName: string, jsxElement: ElementNode) {
    const component = this.getComponent(componentName)
    if (component) {
      component.elements.push(jsxElement)
      jsxElement.parent = component
    }
  }

  // Connect parent-child components
  public connectComponents(parentName: string, childName: string) {
    const parentComponent = this.getComponent(parentName)
    const childComponent = this.getComponent(childName)
    if (parentComponent && childComponent) {
      parentComponent.children.push(childComponent)
      childComponent.parents.push(parentComponent)
      childComponent.elements.forEach((element) => {
        element.next.push(
          ...parentComponent.elements.filter((el) => el.name === childName),
        )
      })
      parentComponent.elements.forEach((element) => {
        element.prev.push(...childComponent.elements)
      })
    }
  }

  public getCode() {
    return getSnippetFromNode(this.program)
  }

  private addProperty(componentName: string, property: PropertyNode) {
    const component = this.getComponent(componentName)
    if (component) {
      component.node.params.push(property.node)
      component.props.push(property)
    }
  }

  private connectAttributeToComponentProperty(
    attribute: AttributeNode,
    componentProperty: PropertyNode,
  ) {
    attribute.location = { file: '', start: 0, end: 0 }
    attribute.change = 'update'
    attribute.properties = [componentProperty]
    attribute.name = componentProperty.name
    attribute.path?.replaceWith(
      t.jSXExpressionContainer(t.identifier(componentProperty.name)),
    )
  }

  private addAttribute(
    elementId: string,
    attributeName: string,
    attributeValue: string,
  ) {
    const element = this.getElement(elementId)
    if (element) {
      const attribute = this.nodeCreator.createAttributeNode(
        attributeName,
        attributeValue,
        element,
      )
      element.attributes.push(attribute)
      if (attributeName === 'children') {
        const node = t.jsxText(attributeValue)
        attribute.node = node
        // element.path?.replaceWith(
        //   t.jsxElement(
        //     element.node.openingElement,
        //     t.jsxClosingElement(
        //       t.jsxIdentifier(element.node.openingElement.name.name),
        //     ),
        //     [node],
        //     false,
        //   ),
        // )
        element.path?.replaceWith(
          t.jsxElement(
            t.jsxOpeningElement(
              element.node.openingElement.name,
              element.node.openingElement.attributes,
            ),
            t.jsxClosingElement(
              t.jsxIdentifier(element.node.openingElement.name.name),
            ),
            [node],
            false,
          ),
        )
      } else {
        element.path?.node.openingElement.attributes.push(
          t.jSXAttribute(t.jsxIdentifier(attribute.name), attribute.node),
        )
      }
    }
  }

  // Transform the properties of a component
  public unlinkAttribute(elementId: string, attributeName: string) {
    const element = this.getElement(elementId)

    if (element) {
      const attribute = this.findAttribute(element, attributeName)
      if (attribute && isLiteralNode(attribute.node)) {
        const oldNode = attribute.node
        const newPropertyName = attribute.name
        const componentProperty =
          this.nodeCreator.createPropertyNode(newPropertyName)
        this.connectAttributeToComponentProperty(attribute, componentProperty)
        this.addProperty(element.parent.name, componentProperty)
        element.next.forEach((nextElement) => {
          this.addAttribute(
            nextElement.id,
            newPropertyName,
            getLiteralValue(oldNode),
          )
        })
      }
    }
  }

  private findAttribute(
    element: ElementNode,
    attributeName: string,
  ): AttributeNode | undefined {
    return element.attributes.find((attr) => attr.name === attributeName)
  }
}

class JSXElement implements Node<t.JSXElement> {
  constructor(private node: t.JSXElement) {}

  public setText(text: string): void {
    this.node.children = [t.jsxText(text)]
  }
}

interface DependencyNode<T extends Node = Node> {
  node: T
  dependencies: DependencyNode<T>[]
  antecedents: DependencyNode<T>[]
}

class Project {
  private fileContents = new Map<string, string>()
  private nodes = new Map<string, DependencyNode>()
  public addFile(file: string, code: string) {
    this.fileContents.set(file, code)
  }

  public findNode(id: string): Node | undefined {
    return this.nodes.get(id)
  }

  private parseCode(file: string, code: string) {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    })

    traverse(ast, {
      'ArrowFunctionExpression|FunctionDeclaration'(path) {
        if (
          !t.isArrowFunctionExpression(path.node) &&
          !t.isFunctionDeclaration(path.node)
        ) {
          return
        }
        const location = getLocation(path.node, file)
        if (!location) return

        const elements: ElementNode[] = []
        const componentNode: ComponentNode = {
          change: 'none',
          children: [],
          elements,
          location,
          name: '',
          path,
          node: path.node,
          parents: [],
          props: [],
        }

        const getNameFromExpression = (
          node: t.JSXExpressionContainer | t.JSXText,
        ): string | undefined => {
          if (
            t.isJSXExpressionContainer(node) &&
            t.isIdentifier(node.expression)
          ) {
            return node.expression.name
          }

          return undefined
        }

        path.traverse({
          JSXElement(elementPath) {
            const elementLocation = getLocation(elementPath.node, file)
            if (!elementLocation) return
            const attributes: AttributeNode[] = []
            const elementNode: ElementNode = {
              id: getHashFromLocation(elementLocation, code),
              attributes,
              location: elementLocation,
              next: [],
              prev: [],
              path: elementPath,
              node: elementPath.node,
              parent: componentNode,
              change: 'none',
              name: t.isJSXIdentifier(elementPath.node.openingElement.name)
                ? elementPath.node.openingElement.name.name
                : '',
            }

            elementPath.traverse({
              JSXAttribute(attrPath) {
                const attributeLocation = getLocation(attrPath.node, file)
                if (!attributeLocation) return

                const attribute: AttributeNode = {
                  change: 'none',
                  index: attributes.length,
                  location: attributeLocation,
                  name: t.isJSXExpressionContainer(attrPath.node.value)
                    ? (getNameFromExpression(attrPath.node.value) ?? '')
                    : '',
                  parent: elementNode,
                  next: [],
                  prev: [],
                  properties: [],
                  path: attrPath,
                  node: attrPath.node,
                }
                attributes.push(attribute)
              },
            })

            elementPath.node.children.forEach((child, i) => {
              if (t.isJSXExpressionContainer(child) || t.isJSXText(child)) {
                const textLocation = getLocation(child, file)
                if (!textLocation) return

                const childNode = elementPath.get(`children.${i}`) as NodePath
                const textNode: AttributeNode = {
                  index: attributes.length,
                  properties: [],
                  location: textLocation,
                  next: [],
                  prev: [],
                  path: childNode,
                  node: childNode.node,
                  parent: elementNode,
                  change: 'none',
                  name: getNameFromExpression(child) ?? 'children',
                }

                attributes.push(textNode)
              }
            })

            elements.push(elementNode)
          },
        })

        componentNode.name = getComponentName(componentNode, path, 'elements')
        graph.addComponent(componentNode)
      },
    })
  }
}

class NodeCreator {
  public createPropertyNode(name: string): PropertyNode {
    return {
      name,
      location: { file: '', start: 0, end: 0 },
      change: 'none',
      node: t.identifier(name),
      path: null,
      next: [],
    }
  }

  public createAttributeNode(
    name: string,
    value: string,
    parent: ElementNode,
  ): AttributeNode {
    return {
      name,
      location: { file: '', start: 0, end: 0 },
      change: 'none',
      node:
        name === 'children'
          ? t.jSXExpressionContainer(t.stringLiteral(value))
          : t.jsxAttribute(t.jsxIdentifier(name), t.stringLiteral(value)),
      path: null,
      properties: [],
      next: [],
      prev: [],
      index: parent.attributes.length,
      parent,
    }
  }
}

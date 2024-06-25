import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import * as t from '@babel/types'
import type { ComponentLocation } from '@harmony/util/src/types/component'
import {
  getLineAndColumn,
  hashComponentId,
} from '@harmony/util/src/utils/component'
import type {
  Attribute,
  HarmonyComponent,
  HarmonyContainingComponent,
} from './types'

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

export function getCodeInfoFromFile(
  file: string,
  originalCode: string,
  componentDefinitions: Record<string, HarmonyContainingComponent>,
  elementInstances: HarmonyComponent[],
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
                    if (!parent.node.openingElement.name.loc) {
                      throw new Error('Invalid location')
                    }
                    const { end } = parent.node.openingElement.name.loc
                    //Even though this is type string, we need to know what the name of the class is we are adding, so we set that as the attribute value
                    sameAttributesInElement.push({
                      ...attribute,
                      reference: parent,
                      name: 'string',
                      value: getAttributeValue(attribute),
                      locationType: 'add',
                      location: {
                        file: parent.location.file,
                        start: end.index,
                        end: end.index,
                      },
                    })
                  }
                  //If we have some things to add, cheerio!
                  if (sameAttributesInElement.length > 0) {
                    attributes.push(...sameAttributesInElement)

                    continue
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
                  if (!parent.node.openingElement.name.loc) {
                    throw new Error('Invalid location')
                  }
                  const { end } = parent.node.openingElement.name.loc
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
                      start: end.index,
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
                node: t.StringLiteral | t.TemplateElement | t.JSXText,
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
                if (!node.openingElement.name.loc) {
                  throw new Error('Invalid location')
                }
                const { end } = node.openingElement.name.loc
                defaultClassName = createAttribute(
                  'className',
                  'string',
                  undefined,
                  '',
                  'add',
                  { file, start: end.index, end: end.index },
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

      // Only consider functions with JSX elements as potential React components
      if (containingComponent.children.length > 0) {
        let componentName = 'AnonymousComponent'

        // Check if the function is assigned to a variable or exported
        if (
          t.isVariableDeclarator(path.parent) &&
          t.isIdentifier(path.parent.id)
        ) {
          componentName = path.parent.id.name
        } else if (
          t.isExportDeclaration(path.parent) &&
          path.parent.type !== 'ExportAllDeclaration' &&
          path.parent.declaration &&
          'id' in path.parent.declaration &&
          t.isIdentifier(path.parent.declaration.id)
        ) {
          componentName = path.parent.declaration.id.name
        } else if (
          t.isFunctionDeclaration(path.node) &&
          t.isIdentifier(path.node.id)
        ) {
          componentName = path.node.id.name
        } else if (
          t.isCallExpression(path.parent) &&
          t.isVariableDeclarator(path.parentPath?.parent) &&
          t.isIdentifier(path.parentPath.parent.id)
        ) {
          componentName = path.parentPath.parent.id.name
        }

        containingComponent.name = componentName
        componentDefinitions[containingComponent.name] = containingComponent
      }
    },
  })

  return true
}

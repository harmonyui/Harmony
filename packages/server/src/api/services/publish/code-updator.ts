 
/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ok*/
/* eslint-disable no-await-in-loop -- ok*/
import type {
  ComponentLocation,
  ComponentUpdate,
} from '@harmony/util/src/types/component'
import { camelToKebab, round } from '@harmony/util/src/utils/common'
import { mergeClassesWithScreenSize } from '@harmony/util/src/utils/tailwind-merge'
import { DEFAULT_WIDTH } from '@harmony/util/src/constants'
import { getCodeSnippet } from '../indexor/github'
import type { HarmonyComponent, Attribute } from '../indexor/types'
import type { GitRepository } from '../../repository/git/types'
import type { HarmonyComponentWithNode } from '../indexor/indexor'
import { indexForComponents } from '../indexor/indexor'
import { addPrefixToClassName, converter } from './css-conveter'

export type FileUpdateInfo = Record<
  string,
  {
    filePath: string
    locations: {
      snippet: string
      start: number
      end: number
      updatedTo: number
      diff: number
    }[]
  }
>

export interface UpdateInfo {
  componentId: string
  component: HarmonyComponentWithNode
  attributes: Attribute[]
  name: string
  type: ComponentUpdate['type']
  oldValue: string
  value: string
  font?: string
}

export interface CodeUpdateInfo {
  dbLocation: ComponentLocation
  location: ComponentLocation & { updatedTo: number }
  updatedCode: string
  attribute?: Attribute
}

export class CodeUpdator {
  constructor(private gitRepository: GitRepository) {}

  public async updateFiles(
    updates: ComponentUpdate[],
  ): Promise<FileUpdateInfo> {
    const elementInstances = await indexForComponents(
      updates.map((update) => update.componentId),
      this.gitRepository,
    )

    const updateInfo = await this.getUpdateInfo(updates, elementInstances)

    const repository = this.gitRepository.repository
    const codeUpdates: CodeUpdateInfo[] = (
      await Promise.all(
        updateInfo.map((info) =>
          this.getChangeAndLocation(info, repository.branch),
        ),
      )
    ).flat()
    codeUpdates.sort((a, b) => a.location.start - b.location.start)

    const fileUpdates = this.transformIntoFileUpdates(codeUpdates)

    return fileUpdates
  }

  private async getUpdateInfo(
    updates: ComponentUpdate[],
    indexedElements: HarmonyComponentWithNode[],
  ): Promise<UpdateInfo[]> {
    return updates.reduce<Promise<UpdateInfo[]>>(async (prevPromise, curr) => {
      const prev = await prevPromise
      if (curr.type === 'className') {
        if (curr.name !== 'font') {
          const cssName = camelToKebab(curr.name)

          //Round the pixel values
          const match = /^(-?\d+(?:\.\d+)?)(\D*)$/.exec(curr.value)
          if (match) {
            const value = parseFloat(match[1] || '0')
            const unit = match[2]
            curr.value = `${round(value)}${unit}`
          }
          curr.value = `${cssName}:${curr.value};`
          curr.oldValue = `${camelToKebab(curr.name)}:${curr.oldValue}`
        }
      }
      const classNameUpdate =
        curr.type === 'className'
          ? prev.find(
              (up) =>
                up.componentId === curr.componentId && up.type === 'className',
            )
          : undefined
      if (classNameUpdate) {
        if (curr.name !== 'font') {
          classNameUpdate.value += curr.value
          classNameUpdate.oldValue += curr.oldValue
        } else {
          classNameUpdate.font = curr.value
        }
      } else {
        const getComponent = (
          currId: string,
        ): Promise<HarmonyComponentWithNode | undefined> => {
          const currElement = indexedElements.find(
            (instance) => instance.id === currId,
          )

          return Promise.resolve(currElement)
        }
        const getAttributes = (
          component: HarmonyComponent,
        ): Promise<Attribute[]> => {
          const allAttributes = component.props

          //Sort the attributes according to layers with the bottom layer first for global
          allAttributes.sort(
            (a, b) =>
              b.reference.id.split('#').length -
              a.reference.id.split('#').length,
          )

          const attributes: Attribute[] = []

          //If this is global, find the first string attribute and get everything on that layer
          for (const attribute of allAttributes) {
            if (
              attribute.type === 'className' &&
              attribute.name === 'string' &&
              curr.isGlobal
            ) {
              attributes.push(
                ...allAttributes.filter(
                  (attr) =>
                    attr.reference.id === attribute.reference.id &&
                    attr.type === 'className',
                ),
              )
            }

            //Continue adding attributes for non-global or global's that don't already have classNames
            if (
              !curr.isGlobal ||
              (attribute.type !== 'className' &&
                !attributes.find(
                  (attr) => attr.type === 'className' && attr.name === 'string',
                ))
            ) {
              attributes.push(attribute)
            }
          }

          //Put the parents first for updating the code
          return Promise.resolve(
            attributes.sort(
              (a, b) =>
                a.reference.id.split('#').length -
                b.reference.id.split('#').length,
            ),
          )
        }
        //We update the parent when we have multiple of the same elements with different updates or the user has specified that it is not a global update
        const component = await getComponent(curr.componentId)
        if (!component) {
          return prev
          //throw new Error('Cannot find component with id ' + curr.componentId);
        }
        const attributes = await getAttributes(component)
        const font =
          curr.type === 'className' && curr.name === 'font'
            ? curr.value
            : undefined
        const value =
          curr.type === 'className' && curr.name === 'font' ? '' : curr.value

        const sameComponent =
          curr.type === 'className'
            ? prev.find(
                ({ component: other, type }) =>
                  type === 'className' &&
                  other.id === component.id &&
                  other.getParent()?.id === component.getParent()?.id,
              )
            : undefined
        if (sameComponent) {
          if (curr.name !== 'font') {
            sameComponent.value += curr.value
            sameComponent.oldValue += curr.oldValue
          } else {
            sameComponent.font = curr.value
          }
        } else {
          prev.push({
            componentId: curr.componentId,
            name: curr.name,
            component,
            oldValue: curr.oldValue,
            value,
            type: curr.type,
            font,
            attributes,
          })
        }
      }
      return prev
    }, Promise.resolve([]))
  }

  private async getChangeAndLocation(
    update: UpdateInfo,
    branchName: string,
  ): Promise<CodeUpdateInfo[]> {
    const { component, type, oldValue: _oldValue, attributes } = update
    const gitRepository = this.gitRepository
    const repository = this.gitRepository.repository

    interface LocationValue {
      location: ComponentLocation
      value: string | undefined
      isDefinedAndDynamic: boolean
    }
    const getLocationAndValue = (
      attribute: Attribute | undefined,
      _component: HarmonyComponent,
    ): LocationValue => {
      const isDefinedAndDynamic = attribute?.name === 'property'
      let value = attribute?.name === 'string' ? attribute.value : undefined

      //Location add means this property doesn't exist and we need to add it, which means value is
      //the name of the property we are adding, not the value of the property
      if (attribute?.locationType === 'add') {
        value = ''
      }
      return {
        location: attribute?.location || _component.location,
        value,
        isDefinedAndDynamic,
      }
    }

    const results: CodeUpdateInfo[] = []

    const addCommentToJSXElement = async ({
      location,
      commentValue,
      attribute,
    }: {
      location: ComponentLocation
      commentValue: string
      attribute: Attribute | undefined
    }): Promise<CodeUpdateInfo> => {
      const comment = ` /** ${commentValue} */`

      const start = location.start
      const end = location.end
      const updatedTo = comment.length + start
      return {
        location: { file: location.file, start, end, updatedTo },
        updatedCode: comment,
        dbLocation: location,
        attribute,
      }
    }

    interface AddClassName {
      location: ComponentLocation
      code: string
      newClass: string
      oldClass: string | undefined
      commentValue: string
      attribute: Attribute | undefined
      isDefinedAndDynamic: boolean
    }
    //This is when we do not have the className data (either className does not exist on a tag or it is dynamic)
    const addNewClassOrComment = async ({
      location,
      code,
      newClass,
      oldClass,
      commentValue,
      attribute,
    }: AddClassName): Promise<CodeUpdateInfo> => {
      if (oldClass === undefined) {
        return addCommentToJSXElement({ location, commentValue, attribute })
      } else if (attribute?.locationType === 'add') {
        const classPropertyName = attribute.value || 'className'
        // eslint-disable-next-line no-param-reassign -- It is ok
        newClass = ` ${classPropertyName}="${newClass}"`
        // eslint-disable-next-line no-param-reassign -- It is ok
        oldClass = ''
      }

      const oldValue = oldClass
      const start = code.indexOf(oldValue)
      const end = oldValue.length + start
      const updatedTo = newClass.length + start
      if (start < 0) {
        throw new Error(
          `There was no update for tailwind classes, snippet: ${code}, oldValue: ${oldValue}`,
        )
      }

      return {
        location: {
          file: location.file,
          start: location.start + start,
          end: location.start + end,
          updatedTo: location.start + updatedTo,
        },
        updatedCode: newClass,
        dbLocation: location,
        attribute,
      }
    }

    switch (type) {
      case 'text':
        {
          const textAttributes = attributes.filter(
            (attr) => attr.type === 'text',
          )
          const index = parseInt(update.name)
          const textAttribute = textAttributes.find(
            (attr) => attr.index === index,
          )
          const { location, value } = getLocationAndValue(
            textAttribute,
            component,
          )

          const elementSnippet = await getCodeSnippet(gitRepository)(
            location,
            branchName,
          )
          const oldValue = value || _oldValue
          const start = elementSnippet.indexOf(oldValue)
          const end = oldValue.length + start
          const updatedTo = update.value.length + start
          if (start < 0) {
            const commentValue = `Change inner text for ${component.name} tag from ${oldValue} to ${update.value}`
            results.push(
              await addCommentToJSXElement({
                location,
                attribute: textAttribute,
                commentValue,
              }),
            )
          } else {
            results.push({
              location: {
                file: location.file,
                start: location.start + start,
                end: location.start + end,
                updatedTo: location.start + updatedTo,
              },
              updatedCode: update.value,
              dbLocation: location,
              attribute: textAttribute,
            })
          }
        }
        break
      case 'className':
        {
          const classNameAttributes = attributes.filter(
            (attr) => attr.type === 'className',
          )

          if (repository.cssFramework === 'tailwind') {
            //This assumes that the update values have already been merged and converted to name:value pairs
            const converted = await converter.convertCSS(`.example {
                            ${update.value}
                        }`)
            const newClasses = converted.nodes.reduce(
              (prev, curr) => prev + curr.tailwindClasses.join(' '),
              '',
            )

            type AttributeUpdate = AddClassName
            const attributeUpdates: AttributeUpdate[] = []

            const getAttribute = async (
              attribute: Attribute | undefined,
              getNewValueAndComment: (
                oldValue: string | undefined,
                location: ComponentLocation,
              ) => {
                newClass: string
                commentValue: string
                oldClass: string | undefined
              },
            ): Promise<{
              attribute: AttributeUpdate
              oldClass: string | undefined
            }> => {
              const locationAndValue = getLocationAndValue(attribute, component)
              //TODO: This is temporary. It shouldn't have 'className:'
              locationAndValue.value = locationAndValue.value?.replace(
                'className:',
                '',
              )
              const { location, value, isDefinedAndDynamic } = locationAndValue
              const elementSnippet = await getCodeSnippet(gitRepository)(
                location,
                branchName,
              )

              //TODO: Make the tailwind prefix part dynamic
              const oldClasses = value
              const { newClass, commentValue, oldClass } =
                getNewValueAndComment(oldClasses, location)

              return {
                attribute: {
                  location,
                  code: elementSnippet,
                  oldClass: value,
                  newClass,
                  isDefinedAndDynamic,
                  commentValue,
                  attribute,
                },
                oldClass,
              }
            }

            const getAttributeFromClass = async (
              attribute: Attribute | undefined,
              _newClass: string,
            ): Promise<{
              attribute: AttributeUpdate
              oldClass: string | undefined
            }> => {
              return getAttribute(attribute, (oldClasses, location) => {
                //If we have already merged classes, then merge out new stuff into what was already merged
                const oldStuff = replaceAll(
                  attributeUpdates.find((attr) => attr.location === location)
                    ?.newClass ?? oldClasses,
                  repository.tailwindPrefix || '',
                  '',
                )
                const mergedIt = mergeClassesWithScreenSize(
                  oldStuff,
                  _newClass,
                  DEFAULT_WIDTH,
                )
                const newClass = repository.tailwindPrefix
                  ? addPrefixToClassName(mergedIt, repository.tailwindPrefix)
                  : mergedIt
                const commentValue = repository.tailwindPrefix
                  ? addPrefixToClassName(newClasses, repository.tailwindPrefix)
                  : newClasses
                const oldWithPrefix =
                  repository.tailwindPrefix && oldStuff
                    ? addPrefixToClassName(oldStuff, repository.tailwindPrefix)
                    : oldStuff

                return { newClass, oldClass: oldWithPrefix, commentValue }
              })
            }

            const addAttribute = (attribute: AttributeUpdate): void => {
              const sameAttributeLocation = attributeUpdates.find(
                (attr) => attr.location === attribute.location,
              )
              if (sameAttributeLocation) {
                sameAttributeLocation.newClass = attribute.newClass
                return
              }

              attributeUpdates.push(attribute)
            }

            const defaultClassName =
              classNameAttributes.find((attr) => attr.name === 'string') ||
              (classNameAttributes[0] as Attribute | undefined)
            for (const newClass of newClasses.split(' ')) {
              let addedAttribute = false
              for (const classNameAttribute of classNameAttributes) {
                if (classNameAttribute.name !== 'string') continue
                const { attribute, oldClass } = await getAttributeFromClass(
                  classNameAttribute,
                  newClass,
                )
                if (
                  oldClass &&
                  attribute.newClass.split(' ').length ===
                    oldClass.split(' ').length
                ) {
                  addAttribute(attribute)
                  addedAttribute = true
                  break
                }
              }
              if (!addedAttribute) {
                addAttribute(
                  (await getAttributeFromClass(defaultClassName, newClass))
                    .attribute,
                )
              }
            }

            if (update.font) {
              const sameAttributeLocation = attributeUpdates.find(
                (attr) => attr.location === defaultClassName?.location,
              )
              if (sameAttributeLocation) {
                sameAttributeLocation.newClass += ` ${update.font}`
              } else {
                attributeUpdates.push(
                  (
                    await getAttribute(defaultClassName, (oldClasses) => {
                      const value = oldClasses
                        ? `${oldClasses} ${update.font}`
                        : update.font || ''

                      return {
                        newClass: value,
                        commentValue: update.font || '',
                        oldClass: oldClasses,
                      }
                    })
                  ).attribute,
                )
              }
            }

            results.push(
              ...(await Promise.all(
                attributeUpdates.map((attribute) =>
                  addNewClassOrComment(attribute),
                ),
              )),
            )

            //TODO: Make the tailwind prefix part dynamic
            // const oldClasses = repository.tailwindPrefix ? value?.replaceAll(repository.tailwindPrefix, '') : value;

            // const mergedIt = mergeClassesWithScreenSize(oldClasses, newClasses, DEFAULT_WIDTH);
            // let mergedClasses = repository.tailwindPrefix ? addPrefixToClassName(mergedIt, repository.tailwindPrefix) : mergedIt;

            // let withPrefix = repository.tailwindPrefix ? addPrefixToClassName(newClasses, repository.tailwindPrefix) : newClasses;
            // mergedClasses = update.font ? `${update.font} ${mergedClasses}` : mergedClasses;
            // withPrefix = update.font ? `${update.font} ${withPrefix}` : withPrefix;

            // result = addNewClassOrComment({location, code: elementSnippet, newClass: mergedClasses, oldClass: value, commentValue: withPrefix, attribute: classNameAttribute, isDefinedAndDynamic});
          } else {
            const componentWithNode: HarmonyComponentWithNode =
              classNameAttributes[0]?.reference || component
            const location: ComponentLocation = {
              file: componentWithNode.location.file,
              start:
                componentWithNode.node.openingElement.name.loc?.end.index || 0,
              end:
                componentWithNode.node.openingElement.name.loc?.end.index || 0,
            }
            let valuesNewLined = replaceAll(update.value, ';', ';\n')
            valuesNewLined = update.font
              ? `font className: ${update.value}\n\n${valuesNewLined}`
              : valuesNewLined
            results.push(
              await addCommentToJSXElement({
                location,
                commentValue: valuesNewLined,
                attribute: classNameAttributes[0],
              }),
            )
          }
        }
        break
      case 'component':
        break
      default:
        throw new Error('Invalid use case')
    }

    return results
  }

  private transformIntoFileUpdates(
    codeUpdates: CodeUpdateInfo[],
  ): FileUpdateInfo {
    const commitChanges: FileUpdateInfo = {}
    for (const update of codeUpdates) {
      let change = commitChanges[update.location.file]
      if (!change) {
        change = { filePath: update.location.file, locations: [] }
        commitChanges[update.location.file] = change
      }
      const newLocation = {
        snippet: update.updatedCode,
        start: update.location.start,
        end: update.location.end,
        updatedTo: update.location.updatedTo,
        diff: 0,
      }
      const last = change.locations[change.locations.length - 1]
      if (last) {
        const diff = last.updatedTo - last.end + last.diff
        if (last.updatedTo > newLocation.start + diff) {
          if (last.snippet === newLocation.snippet) continue
          //throw new Error("Conflict in changes")
          console.log(`Conflict?: ${last.end}, ${newLocation.start + diff}`)
        }

        newLocation.start += diff
        newLocation.end += diff
        newLocation.updatedTo += diff
        newLocation.diff = diff
      }

      const diff = newLocation.updatedTo - newLocation.end

      const ends = codeUpdates.filter(
        (f) => f.dbLocation.end >= update.location.end,
      )
      ends.forEach((end) => {
        end.dbLocation.end += diff
        if (end.dbLocation.start >= newLocation.start) {
          end.dbLocation.start += diff
        }
      })

      change.locations.push(newLocation)
    }

    return commitChanges
  }
}

const replaceAll = <T extends string | undefined>(
  str: T,
  findStr: string,
  withStr: string,
): T => {
  if (!str) return str

  const newStr = str.replace(new RegExp(findStr, 'g'), withStr)

  return newStr as T
}

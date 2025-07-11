import clsx from 'clsx'
import dayjs from 'dayjs'
import type { HexColor } from '../types/colors'
import { v4 as uuidv4 } from 'uuid'

export const displayDate = (date: Date) => {
  return dayjs(date).format('MM/DD/YY')
}

export const displayDateFull = (date: Date) => {
  return dayjs(date).format('MMM DD, YYYY')
}

export const displayDateShort = (date: Date): string => {
  return dayjs(date).format('MMM DD')
}

export const displayTime = (date: Date): string => {
  return dayjs(date).format('h:mm A')
}

export const formatDollarAmount = (amount: number): string => {
  const digits = Math.floor(amount).toString().split('').reverse()
  let str = ''
  for (let i = 0; i < digits.length; i++) {
    str = digits[i] + str
    if (i % 3 === 2 && i > 0 && i < digits.length - 1) {
      str = `,${str}`
    }
  }

  // There's got to be a better way to do this
  return `$${str}${(Math.round((amount - Math.floor(amount)) * 100) / 100)
    .toString()
    .slice(1)}`
}

export const second = 1000
export const minute = 60000
export const hour = 3600000
export const day = 86400000
export const week = 604800000
export const calculateDateDifference = (
  milisecondsSinceToday: number,
): Date => {
  const today = new Date()
  today.setTime(today.getTime() - milisecondsSinceToday)

  return today
}

export const displayElapsedTime = (time: Date): string => {
  const currTime = new Date()
  const elapsedTime = currTime.getTime() - time.getTime()

  if (elapsedTime < minute) {
    return `${round(elapsedTime / second)}s ago`
  }

  if (elapsedTime < hour) {
    return `${round(elapsedTime / minute)}m ago`
  }

  if (elapsedTime < day) {
    return `${round(elapsedTime / hour)}h ago`
  }

  if (elapsedTime < week) {
    return `${round(elapsedTime / day)}d ago`
  }

  return displayDate(time)
}

export const displayRelativeDate = (date: Date): string => {
  const elapsedTime = new Date().getTime() - date.getTime()
  if (elapsedTime < day) {
    return 'Today'
  }

  if (elapsedTime < day * 2) {
    return 'Yesterday'
  }

  return displayDate(date)
}

export const round = (value: number, digits = 0, floor = false): number => {
  if (digits < 0)
    throw new Error('Invalid argument digits. Must be less than zero')

  const places = Math.pow(10, digits)
  const func = floor ? 'floor' : 'round'
  return Math[func](value * places) / places
}

export const displayStorageSpace = (value: number): string => {
  if (value < 1000) {
    return `${value} B`
  }

  if (value < 1000000) {
    return `${Math.round(value / 100) / 10} KB`
  }

  if (value < 1000000000) {
    return `${Math.round(value / 100000) / 10} MB`
  }

  return `${Math.round(value / 100000000) / 10} GB`
}

export const compare = <T extends string | number | Date>(
  f1: T,
  f2: T,
): number => {
  if (typeof f1 === 'string' && typeof f2 === 'string') {
    return f1.localeCompare(f2)
  }

  if (typeof f1 === 'number' && typeof f2 === 'number') {
    return f1 - f2
  }

  if (typeof f1 === 'object' && typeof f2 === 'object') {
    return compare(f1.getTime(), f2.getTime())
  }

  return 0
}

export const getClass = (...strings: (string | undefined)[]) => {
  return clsx(...strings)
}

export const getNumberFromString = (str: string): number => {
  // const match = /^(\d+)\D*$/.exec(str);

  // if (match === null) {
  //   throw new Error("There is no error in string " + str);
  // }

  // return Number(match[1]);

  return parseFloat(str)
}

export const groupBy = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  return arr.reduce<Record<T[K], T[]>>((prev, curr) => {
    let a: T[] = []
    const val = prev[curr[key]] as Record<T[K], T[]>[T[K]] | undefined
    if (val) {
      a = val
    }
    a.push(curr)
    prev[curr[key]] = a

    return prev
  }, {})
}

export const groupByDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K) {
  return arr.reduce<Record<T[K], T>>((prev, curr) => {
    const a = prev[curr[key]] as Record<T[K], T>[T[K]] | undefined
    if (a) {
      throw new Error('Each key value in the list must be unique')
    }

    prev[curr[key]] = curr

    return prev
  }, {})
}

export const groupTogether = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  const groups = groupBy(arr, key)

  return Object.keys(groups)
}

export const groupTogetherDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K): string[] {
  const groups = groupByDistinct(arr, key)

  return Object.keys(groups)
}

export const mergeArraysOnId = <
  Key extends string,
  T extends { [K in Key]: string },
>(
  currArray: T[],
  newArray: T[],
  idKey: Key,
) => {
  const copy = currArray.slice()
  for (const item of newArray) {
    const currItemIndex = copy.findIndex((curr) => curr[idKey] === item[idKey])
    if (currItemIndex >= 0) {
      copy[currItemIndex] = item
    } else {
      copy.push(item)
    }
  }

  return copy
}

export function isDateInBetween(
  test: Date | undefined,
  start: Date | undefined,
  end: Date | undefined,
): boolean {
  if (test === undefined) {
    return true
  }
  return (
    (start !== undefined ? start <= test : true) &&
    (end !== undefined ? test <= end : true)
  )
}

export const arrayOfAll =
  <T>() =>
  <U extends T[]>(
    array: U & (T extends U[number] ? unknown : Exclude<T, U[number]>),
  ) =>
    array

export const constArray =
  <T>() =>
  <U extends T[]>(array: U) =>
    array

export function convertRgbToHexOrReturn(rgb: string): HexColor | undefined {
  let match = /^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/.exec(rgb)
  if (match === null) {
    match = /^rgba\((\d+), \s*(\d+), \s*(\d+), \s*(\d+(?:\.\d+)?)\)$/.exec(rgb)
    if (!match) {
      return undefined
    }
  }
  function hexCode(i: string) {
    // Take the last 2 characters and convert
    // them to Hexadecimal.
    return `0${parseInt(i).toString(16)}`.slice(-2)
  }

  return `#${hexCode(match[1])}${hexCode(match[2])}${hexCode(
    match[3],
  )}${match[4] ? hexCode(`${parseFloat(match[4]) * 255}`) : ''}`
}
export function convertRgbToHex(rgb: string): HexColor {
  const color = convertRgbToHexOrReturn(rgb)
  if (color === undefined) {
    console.error(`Invalid rgb ${rgb}`)
    return '#000000'
  }

  return color
}

export function capitalizeFirstLetter(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`
}

export const hashCode = function (str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)

  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

export function replaceByIndex(
  s: string,
  replaceText: string,
  start: number,
  end?: number,
): string {
  if (start < 0 || start >= s.length) return s.toString()

  let ret = `${s.substring(0, start)}${replaceText}`
  if (end !== undefined) {
    ret += s.substring(end)
  }

  return ret
}

export const close = (a: number, b: number, threshold: number): boolean => {
  return Math.abs(a - b) <= threshold
}

export const wordToKebabCase = (str: string): string => {
  return str
    .split(' ')
    .map((word) => `${word[0].toLowerCase()}${word.substring(1)}`)
    .join('-')
}

export const kebabToWord = (kebabCase: string): string => {
  return kebabCase
    .split('-')
    .map((word) => capitalizeFirstLetter(word.toLowerCase()))
    .join(' ')
}

export const camelToKebab = (camelCase: string): string => {
  return camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

export const validPathRegex =
  /^(?!.*[\/\\]\.[^\/\\]*)(?!.*[\/\\]node_modules[\/\\])[^\s.\/\\][^\s]*\.(tsx|jsx|js)$/
export const isValidPath = (path: string): boolean => {
  return validPathRegex.test(path)
}

export function areHexColorsEqual(color1: string, color2: string): boolean {
  const normalize = (color: HexColor) => {
    // Remove the hash if present, and make it lowercase
    const hex = color.replace('#', '').toLowerCase()
    // If it's a 3-character hex, expand it to 6-character
    return hex.length === 3
      ? hex
          .split('')
          .map((char) => char + char)
          .join('')
      : hex.length === 8 || hex.slice(6) === 'ff'
        ? hex.slice(0, 6)
        : hex
  }

  return (
    normalize(convertRgbToHexOrReturn(color1) ?? (color1 as HexColor)) ===
    normalize(convertRgbToHexOrReturn(color2) ?? (color2 as HexColor))
  )
}

export const replaceAll = <T extends string | undefined>(
  str: T,
  findStr: string,
  withStr: string,
): T => {
  if (!str) return str

  const newStr = str.replaceAll(findStr, withStr)

  return newStr as T
}

export const htmlEncode = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const getTextInBetween = (str: string, start: string, end: string) => {
  const startIndex = str.indexOf(start)
  if (startIndex === -1) {
    return ''
  }

  const endIndex = str.indexOf(end, startIndex + start.length)
  if (endIndex === -1) {
    return ''
  }

  return str.substring(startIndex + start.length, endIndex)
}

export const getFileContents = async (
  files: string[],
  readFile: (filepath: string) => Promise<string>,
) => {
  const visitedFiles: Set<string> = new Set<string>()
  const fileContents: { file: string; content: string }[] = []

  const visitPaths = async (filepath: string) => {
    if (visitedFiles.has(filepath)) return

    visitedFiles.add(filepath)
    const content = await readFile(filepath)
    fileContents.push({ file: filepath, content })
  }

  await Promise.all(files.map(visitPaths))

  return fileContents
}

export const generateUniqueId = () => {
  return uuidv4()
}

export const addOnTrim = (str: string, strWithTrim: string) => {
  const match = strWithTrim.match(/^(\s*)(.*?)(\s*)$/)
  if (!match) return str
  const [, leadingSpaces, , trailingSpaces] = match
  return `${leadingSpaces}${str}${trailingSpaces}`
}

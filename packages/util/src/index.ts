import dayjs from "dayjs";
import { Change } from "diff";
import { z } from "zod";
import { diffChars } from "diff";
import { ComponentUpdate } from "@harmony/ui/src/types/component";

export const displayDate = (date: Date) => {
  return dayjs(date).format("MM/DD/YY");
};

export const displayDateFull = (date: Date) => {
  return dayjs(date).format("MMM DD, YYYY");
}

export const displayTime = (date: Date): string => {
	return dayjs(date).format("h:mm A");
}

export const formatDollarAmount = (amount: number): string => {
  const digits = Math.floor(amount).toString().split("").reverse();
  let str = "";
  for (let i = 0; i < digits.length; i++) {
    str = digits[i] + str;
    if (i % 3 === 2 && i > 0 && i < digits.length - 1) {
      str = "," + str;
    }
  }

  // There's got to be a better way to do this
  return `$${str}${(Math.round((amount - Math.floor(amount)) * 100) / 100)
    .toString()
    .slice(1)}`;
};

export const second = 1000;
export const minute = 60000;
export const hour = 3600000;
export const day = 86400000;
export const week = 604800000;
export const calculateDateDifference = (milisecondsSinceToday: number): Date => {
	const today = new Date();
	today.setTime(today.getTime() - milisecondsSinceToday);

	return today;
}

export const displayElapsedTime = (time: Date): string => {
  const currTime = new Date();
  const elapsedTime = currTime.getTime() - time.getTime();

  if (elapsedTime < minute) {
    return `${round(elapsedTime / second)}s ago`;
  }

  if (elapsedTime < hour) {
    return `${round(elapsedTime / minute)}m ago`;
  }

  if (elapsedTime < day) {
    return `${round(elapsedTime / hour)}h ago`;
  }

  if (elapsedTime < week) {
    return `${round(elapsedTime / day)}d ago`;
  }

  return displayDate(time);
};

export const displayRelativeDate = (date: Date): string => {
	const elapsedTime = new Date().getTime() - date.getTime();
	if (elapsedTime < day) {
		return 'Today';
	}

	if (elapsedTime < day * 2) {
		return 'Yesterday';
	}

	return displayDate(date);
}

export const round = (value: number, digits = 0, floor=false): number => {
  if (digits < 0) throw new Error("Invalid argument digits. Must be less than zero");
  
  const places = Math.pow(10, digits);
  const func = floor ? 'floor' : 'round'
  return Math[func](value * places) / places;
};

export const displayStorageSpace = (value: number): string => {
  if (value < 1000) {
    return `${value} B`;
  }

  if (value < 1000000) {
    return `${Math.round(value / 100) / 10} KB`;
  }

  if (value < 1000000000) {
    return `${Math.round(value / 100000) / 10} MB`;
  }

  return `${Math.round(value / 100000000) / 10} GB`;
};

export const compare = <T extends string | number | Date>(f1: T, f2: T): number => {
  if (typeof f1 === "string" && typeof f2 === "string") {
    return f1.localeCompare(f2);
  }

  if (typeof f1 === "number" && typeof f2 === "number") {
    return f1 - f2;
  }

	if (typeof f1 === 'object' && typeof f2 === 'object') {
		return compare(f1.getTime(), f2.getTime());
	}

  return 0;
};

export const getClass = (...strings: (string | undefined)[]) => {
  return strings.filter((x) => !!x).join(" ");
};

export const getNumberFromString = (str: string): number => {
  // const match = /^(\d+)\D*$/.exec(str);

  // if (match === null) {
  //   throw new Error("There is no error in string " + str);
  // }

  // return Number(match[1]);

  return parseFloat(str);
}

export const groupBy = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  return arr.reduce<Record<T[K], T[]>>((prev, curr) => {
    let a: T[] = [];
    const val = prev[curr[key]];
    if (val) {
      a = val;
    }
    a?.push(curr);
    prev[curr[key]] = a;

    return prev;
  }, {});
};

export const groupByDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K) {
  return arr.reduce<Record<T[K], T>>((prev, curr) => {
    if (prev[curr[key]]) {
      throw new DOMException("Each key value in the list must be unique");
    }

    prev[curr[key]] = curr;

    return prev;
  }, {});
};

export const groupTogether = function <T extends Pick<T, K>, K extends keyof T>(
  arr: T[],
  key: K,
) {
  const groups = groupBy(arr, key);

  return Object.keys(groups);
};

export const groupTogetherDistinct = function <
  T extends Pick<T, K>,
  K extends keyof T,
>(arr: T[], key: K): string[] {
  const groups = groupByDistinct(arr, key);

  return Object.keys(groups);
};

export function isDateInBetween(
  test: Date | undefined,
  start: Date | undefined,
  end: Date | undefined,
): boolean {
  if (test === undefined) {
    return true;
  }
  return (
    (start !== undefined ? start <= test : true) &&
    (end !== undefined ? test <= end : true)
  );
}

export const arrayOfAll = <T,>() => <U extends T[]>(
  array: U & ([T] extends [U[number]] ? unknown : Exclude<T, U[number]>)
) => array;

export const stringUnionSchema = <T extends readonly string[]>(array: T) => z.custom<T[number]>((data) => typeof data === 'string' && array.includes(data));


export function convertRgbToHex(rgb: string) { 
  let match = rgb.match(/^rgb\((\d+), \s*(\d+), \s*(\d+)\)$/); 
  if (match === null) {
    match = rgb.match(/^rgba\((\d+), \s*(\d+), \s*(\d+), \s*(\d+(?:\.\d+)?)\)$/)
    if (!match)
      console.error('Invalid rgb ' + rgb);
      return '#000000';
  }
  function hexCode(i: string) { 
        
      // Take the last 2 characters and convert 
      // them to Hexadecimal. 
      return ("0" + parseInt(i).toString(16)).slice(-2); 
  } 
  return "#" + hexCode(match[1]) + hexCode(match[2]) 
                  + hexCode(match[3]) + (match[4] ? hexCode(`${parseFloat(match[4]) * 255}`) : ''); 
}

export function capitalizeFirstLetter(str: string): string {
  return `${str[0].toUpperCase()}${str.slice(1)}`;
}

declare global {
	interface String {
			hashCode(seed?: number) : number;
	}
}

String.prototype.hashCode = function(seed = 0): number {
	const str = this;
	let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
	for(let i = 0, ch; i < str.length; i++) {
			ch = str.charCodeAt(i);
			h1 = Math.imul(h1 ^ ch, 2654435761);
			h2 = Math.imul(h2 ^ ch, 1597334677);
	}
	h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
	h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
	h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
	h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function replaceByIndex(s: string, replaceText: string, start: number, end?: number): string {
  if (start < 0 || start >= s.length) return s.toString();

	let ret = `${s.substring(0, start)}${replaceText}`;
	if (end !== undefined) {
		ret += s.substring(end);
	}

	return ret;
}

export function hashComponentId({file, startLine, startColumn, endLine, endColumn}: {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number}) {
  return btoa(`${file}:${startLine}:${startColumn}:${endLine}:${endColumn}`);
}

export function updateLocationFromDiffs({file, startLine, startColumn, endLine, endColumn}: {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number}, diffs: Change[], diffCharsd?: Change[]) {
  let currLine = 1;
  let currColumn = 0;
  let newLineStart = startLine;
  let newLineEnd = endLine;
  let newColumnStart = startColumn;
  let newColumnEnd = endColumn;

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    if (diff.count === undefined) throw new Error("Why is there no line count?");
    const lineCount = diff.count;
    const columnCount = 0;

    
    if (currLine > endLine) break;

    if (diff.added || diff.removed) {
      let sign = diff.added ? 1 : -1;
      if (currLine < startLine) {
        newLineStart += lineCount * sign;
      } else if (currLine === startLine) {
        return undefined;
        // if (diff.removed && i < diffs.length - 1 && diffs[i+1].added) {
        //   const diffsChared = diffChars(diff.value, diffs[i+1].value);
        //   currColumn = 0;
        //   for (const diffChar of diffsChared) {
        //     if (currColumn > startColumn) break;
        //     if (diffChar.count === undefined) throw new Error("Why is there no char count?");
        //     if (diffChar.added || diffChar.removed) {
        //       let sign = diffChar.added ? 1 : -1;
        //       if (currColumn <= startColumn) {
        //         newColumnStart += diffChar.count * sign;
        //       } 
        //     } else {
        //       currColumn += diffChar.count;
        //     }
        //   }
        //   i++;
        //   continue;
        // }
      }
      if (currLine < endLine) {
        newLineEnd += lineCount * sign;
      } else if (currLine === endLine) {
        return undefined;
        // if (diff.removed && i < diffs.length - 1 && diffs[i+1].added) {
        //   const diffsChared = diffChars(diff.value, diffs[i+1].value);
        //   currColumn = 0;
        //   for (const diffChar of diffsChared) {
        //     if (currColumn > endColumn) break;
        //     if (diffChar.count === undefined) throw new Error("Why is there no char count?");
        //     if (diffChar.added || diffChar.removed) {
        //       let sign = diffChar.added ? 1 : -1;
        //       if (currColumn < endColumn) {
        //         newColumnEnd += diffChar.count * sign;
        //       } else if (currColumn === endColumn) {
        //         throw new Error("What is this")
        //       }
        //     } else {
        //       currColumn += diffChar.count;
        //     }
        //   }
        // }
      }
    } else {
      currLine += lineCount;
    }

    currColumn += columnCount;
  }

  return {file, startLine: newLineStart, endLine: newLineEnd, startColumn: newColumnStart, endColumn: newColumnEnd};
}

export function getLineAndColumn(text: string, index: number): { line: number; column: number } {
  const lines = text.split("\n");
  let currentLine = 0;
  let currentColumn = index;
  
  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + 1; // Include the newline character
    if (currentColumn <= lineLength) {
    break;
    } else {
    currentLine++;
    currentColumn -= lineLength;
    }
  }
  
  return { line: currentLine + 1, column: currentColumn };
}

export function getIndexFromLineAndColumn(text: string, line: number, column: number): number | undefined {
  const lines = text.split("\n");
  let currentIndex = 0;

  for (let i = 0; i < line; i++) {
    if (i < lines.length) {
      currentIndex += lines[i].length + 1; // Add 1 for the newline character
    } else {
      return undefined; // Line number out of range
    }
  }

  if (column < lines[line].length) {
    currentIndex += column;
    return currentIndex;
  }

  return undefined; // Column number out of range
}

export const close = (a: number, b: number, threshold: number): boolean => {
	return Math.abs(a-b) <= threshold;
}

export const reverseUpdates = <T extends ComponentUpdate>(updates: T[]): T[] => {
  const reversed: T[] = [];
  for (let i = updates.length - 1; i >= 0; i--) {
    const update = updates[i];
    reversed.push({...update, oldValue: update.value, value: update.oldValue});
  }

  return reversed
}
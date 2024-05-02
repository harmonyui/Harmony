import { Change, diffChars } from "diff";
import { ComponentUpdate } from "../types/component";

export const LOCALHOST = 'localhost';

export type ResizeCoords = 'n' | 'e' | 's' | 'w';
//Some update values are not already in css form (like spacing and size). Convert them
export function translateUpdatesToCss(updates: ComponentUpdate[]): ComponentUpdate[] {
	const translated: ComponentUpdate[] = [];

	for (const update of updates) {
		if (update.type !== 'className') {
			translated.push(update);
		} else {
			if (update.name === 'spacing') {
				const [line, letter] = update.value.split('-');
				const lineHeight: ComponentUpdate = {...update, name: 'lineHeight', value: line};
				const letterSpacing: ComponentUpdate = {...update, name: 'letterSpacing', value: letter};
				translated.push(...[lineHeight, letterSpacing]);
			} else if (update.name === 'size') {
				const useHeight = update.value.startsWith('h');
				const value = update.value.replace('h', '');
				const directionsStr = value.split(':');
				const mappingPadding: Record<ResizeCoords, 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'> = {
					n: 'paddingTop',
					e: 'paddingRight',
					s: 'paddingBottom',
					w: 'paddingLeft'
				}
				const mappingHeight: Record<ResizeCoords, 'width' | 'height'> = {
					n: 'height',
					e: 'width',
					s: 'height',
					w: 'width'
				}
				for (const directionStr of directionsStr) {
					const [direction, _value] = directionStr.split('=');
					if (isNaN(Number(_value))) throw new Error("Value must be a number: " + _value);
					if (direction.length !== 1 || !'nesw'.includes(direction)) throw new Error("Invalid direction " + direction);

					const valueStyle = `${_value}px`;
					const mapping = useHeight ? mappingHeight : mappingPadding;
					const spaceUpdate = {...update, name: mapping[direction as ResizeCoords], value: valueStyle};
					translated.push(spaceUpdate);
				}
			}  else {
				translated.push(update);
			}
		}
	}

	return translated;
}

export function hashComponentId({file, startLine, startColumn, endLine, endColumn}: {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number}) {
    return btoa(`${file}:${startLine}:${startColumn}:${endLine}:${endColumn}`);
  }
  
  export function getLocationFromComponentId(id: string): {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number} {
      const stuff = atob(id);
      const [file, startLine, startColumn, endLine, endColumn] = stuff.split(':');
  
      return {
          file, 
          startLine: Number(startLine), 
          startColumn: Number(startColumn), 
          endLine: Number(endLine), 
          endColumn: Number(endColumn)
      };
  }

export const reverseUpdates = <T extends ComponentUpdate>(updates: T[]): T[] => {
    const reversed: T[] = [];
    for (let i = updates.length - 1; i >= 0; i--) {
      const update = updates[i];
      reversed.push({...update, oldValue: update.value, value: update.oldValue});
    }
  
    return reversed
}

export function getLineAndColumn(text: string, index: number): { line: number; column: number } {
    const lines = text.split("\n");
    let currentLine = 0;
    let currentColumn = index;

    for (const line of lines) {
      const lineLength = line.length + 1; // Include the newline character
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

    for (let i = 0; i < line - 1; i++) {
        if (i < lines.length) {
        currentIndex += lines[i].length + 1; // Add 1 for the newline character
        } else {
        return undefined; // Line number out of range
        }
    }

    if (column <= lines[line - 1].length) {
        currentIndex += column;
        return currentIndex;
    }

    return undefined; // Column number out of range
}

export type Environment = 'production' | 'staging' | 'development';

export function getWebUrl(environment: Environment) {
    if (environment === 'production') {
        return 'https://dashboard.harmonyui.app'
    } else if (environment === 'staging') {
        return 'https://harmony-xi.vercel.app'
    }

    return `http://${LOCALHOST}:4200`;
}

export function updateLocationFromContent({file, startLine, startColumn, endLine, endColumn}: {file: string, startLine: number, startColumn: number, endLine: number, endColumn: number}, oldContent: string, newContent: string) {
    const diffs = diffChars(oldContent, newContent);
    
    const startIndex = getIndexFromLineAndColumn(oldContent, startLine, startColumn);
    if (startIndex === undefined) throw new Error(`Invalid line and column ${startLine} ${startColumn} of content ${oldContent}`);
  
    const newStartIndex = updateIndexFromDiffs(startIndex, diffs);
    if (newStartIndex === undefined) return undefined;
    
    const endIndex = getIndexFromLineAndColumn(oldContent, endLine, endColumn);
    if (endIndex === undefined) throw new Error(`Invalid line and column ${endLine} ${endColumn} of content ${oldContent}`);
  
    const newEndIndex = updateIndexFromDiffs(endIndex, diffs);
    if (newEndIndex === undefined) return undefined;
  
    const {line: newLineStart, column: newColumnStart} = getLineAndColumn(newContent, newStartIndex);
    const {line: newLineEnd, column: newColumnEnd} = getLineAndColumn(newContent, newEndIndex);
  
    return {file, startLine: newLineStart, endLine: newLineEnd, startColumn: newColumnStart, endColumn: newColumnEnd};
  }

export function updateIndexFromDiffs(index: number, diffs: Change[]): number | undefined {
    let currIndex = 0;
    let newIndex = index;
    for (let i = 0; i < diffs.length; i++) {
      const diff = diffs[i];
      if (diff.count === undefined) throw new Error("Why is there no line count?");
      //const lineCount = diff.count;
      const valueCount = diff.value.length;
      
      
      if (currIndex > index) break;
  
      if (diff.added || diff.removed) {
        const sign = diff.added ? 1 : -1;
        if (currIndex < index) {
          newIndex += valueCount * sign;
        } else if (currIndex === index) {
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
  
        //Make sure we account for things that are getting replaced in our curr line calculation
        if (diff.removed && diffs[i + 1].added) {
          currIndex += valueCount;
        }
      } else {
        currIndex += valueCount;
      }
    }
  
    return newIndex;
  }
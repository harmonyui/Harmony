import {ComponentUpdate} from '@harmony/ui/src/types/component';
import {ResizeCoords} from '@harmony/ui/src/hooks/resize';

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
				const directionsStr = update.value.split(':');
				const mapping: Record<ResizeCoords, 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight'> = {
					n: 'paddingTop',
					e: 'paddingRight',
					s: 'paddingBottom',
					w: 'paddingLeft'
				}
				for (const directionStr of directionsStr) {
					const [direction, value] = directionStr.split('=');
					if (isNaN(Number(value))) throw new Error("Value must be a number: " + value);
					if (direction.length !== 1 || !'nesw'.includes(direction)) throw new Error("Invalid direction " + direction);

					const valueStyle = `${value}px`;
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
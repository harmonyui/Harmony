import { Attribute, ComponentElement, HarmonyComponent } from '@harmony/types/component';
import fs from 'node:fs';
import { info } from '../load/route';


const replaceClassName = (className: string, oldClassName: string, newClassName: string) => {
	oldClassName.split(' ').forEach(name => {
		className = className.replaceAll(name, '');
	})

	return `${className} ${newClassName}`;
}

export async function POST(req: Request): Promise<Response> {
	const body = await req.json() as {id: string, oldValue: Attribute[], newValue: Attribute[]};
	const component = info.elementInstances.find(el => el.id === body.id);
	console.log(info.elementInstances);
	if (component === undefined) {
		throw new Error('Cannot find component with id ' + body.id);
	}
	const d = fs.readFileSync(component.location.file, 'utf8');
	// const index = d.split('\n', body.lineNumber - 1).join('\n').length;
	// const str = d.substring(index);
	// const match = /\<(\w*)\s+[\S\s]*?(?:className="([^\"]*)")[\S\s]*?\>/.exec(str);
	
	// if (match === null) {
	// 	throw new Error('Invalid match for ' + str);
	// }

	// const [orig, tag, className] = match;

	// const newElement = orig.replace(className, replaceClassName(className, body.oldClassName, body.newClassName));

	//const newD = d.replace(orig, newElement);

	let newD = d;
	for (let i = 0; i < body.newValue.length; i++) {
		const newAttr = body.newValue[i];
		const oldAttr = body.oldValue.find(value => value.id === newAttr.id);
		if (oldAttr === undefined) throw new Error('Cannot find old attribute ' + newAttr.id);
		
		newD = newD.replace(oldAttr.value, newAttr.value);
	}

	fs.writeFileSync(component.location.file, newD);

	return new Response(JSON.stringify({}), {
		status: 200,
	})
}
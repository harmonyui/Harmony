import { twMerge } from 'tailwind-merge'

type ScreenModifier = '' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
const modifiers: [ScreenModifier, number][] = [
    ["2xl", 1536],
    ["xl", 1280],
    ["lg", 1024],
    ["md", 768],
    ["sm", 640],
    ['', 0],
]

export function mergeClassesWithScreenSize(originalClass: string | undefined, newClass: string, screenSize: number) {
    const getSizeModifierIndex = (): number => {
        for (let i = 0; i < modifiers.length; i++) {
            const [_modifer, size] = modifiers[i];
            if (screenSize >= size) {
                return i;
            }
        }

        return 0;
    }

    const splitClasses = (classes: string): string[] => {
        const split = classes.split(' ');

        return split.filter(s => s.length > 0);
    }

    if (!originalClass) return newClass;

    const modifierIndex = getSizeModifierIndex();

    let newOriginalClass = originalClass;
    const newClasses = splitClasses(newClass);

    //p-4 md:p-3, lg:p-2
    for (const klass of newClasses) {
        const numClasses = splitClasses(newOriginalClass).length;
        let merged = '';
        for (let i = modifierIndex; i < modifiers.length; i++) {
            const [modifier] = modifiers[i];
            merged = twMerge(newOriginalClass, `${modifier ? `${modifier}:` : ''}${klass}`);
            if (splitClasses(merged).length === numClasses) {
                break;
            }
        }

        newOriginalClass = merged;
    }

    return newOriginalClass;
}
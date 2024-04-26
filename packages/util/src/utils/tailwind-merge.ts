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
    const getSizeModifierIndex = (screenSize: number): number => {
        for (let i = 0; i < modifiers.length; i++) {
            const [modifer, size] = modifiers[i];
            if (screenSize >= size) {
                return i;
            }
        }

        return 0;
    }

    if (!originalClass) return newClass;

    const modifierIndex = getSizeModifierIndex(screenSize);

    let newOriginalClass = originalClass;
    const newClasses = newClass.split(' ');

    //p-4 md:p-3, lg:p-2
    for (const klass of newClasses) {
        const numClasses = newOriginalClass.split(' ').length;
        let merged = '';
        for (let i = modifierIndex; i < modifiers.length; i++) {
            const [modifier] = modifiers[i];
            merged = twMerge(newOriginalClass, `${modifier ? `${modifier}:` : ''}${klass}`);
            if (merged.split(' ').length === numClasses) {
                break;
            }
        }

        newOriginalClass = merged;
    }

    return newOriginalClass;
}
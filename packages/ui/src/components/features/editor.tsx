"use client";
import { useRef, useState } from 'react'

import {HarmonyProvider} from '../../../../editor/src/components/harmony-provider'



export const EditorDisplay: React.FunctionComponent<{branchId: string}> = ({branchId}) => {
    const [rootElement, setRootElement] = useState<HTMLDivElement>();
    const bodyMutation = new MutationObserver(() => undefined)
    return (<>
        <div ref={(div) => {
            if (div) {
                setRootElement(div);
            }
        }}>
            Here is some text
        </div>
        {rootElement ? <HarmonyProvider repositoryId="da286f25-b5de-4003-94ed-2944162271ed" branchId={branchId} rootElement={rootElement} bodyObserver={bodyMutation}/> : null}
    </>)
}
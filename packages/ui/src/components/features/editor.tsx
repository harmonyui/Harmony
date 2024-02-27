"use client";
import { useRef, useState } from 'react'

import {HarmonyProvider} from '../../../../editor/src/components/harmony-provider'



export const EditorDisplay: React.FunctionComponent<{branchId: string}> = ({branchId}) => {
    const setup = {
        changeMode: () => undefined,
        setContainer: () => undefined
    }
    return (<>
        <HarmonyProvider repositoryId="da286f25-b5de-4003-94ed-2944162271ed" branchId={branchId} setup={setup} >
            <div>
                Here is some text
            </div>
        </HarmonyProvider>
    </>)
}
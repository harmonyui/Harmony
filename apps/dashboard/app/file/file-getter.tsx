'use client';

import { Button } from "@harmony/ui/src/components/core/button";
import CodeSnippet from "@harmony/ui/src/components/core/code-snippet";
import { Input } from "@harmony/ui/src/components/core/input";
import { Label } from "@harmony/ui/src/components/core/label";
import { getLocationsFromComponentId } from "@harmony/util/src/utils/component";
import { useState } from "react";

export default function FileGetter({onSubmit: onSubmitProps}: {onSubmit: (ops: {repositoryId: string, file: string}) => Promise<string>}) {
    const [repositoryId, setRepositoryId] = useState<string>();
    const [harmonyId, setHarmonyId] = useState<string>();
    const [code, setCode] = useState<string[]>([]);

    const onSubmit = () => {
        if (!harmonyId || !repositoryId) return;

        const locations = getLocationsFromComponentId(harmonyId);

        const promises: Promise<string>[] = [];
        for (const location of locations) {
            promises.push(onSubmitProps({file: location.file, repositoryId}));
        }

        void Promise.all(promises).then(codes => {setCode(codes)});
    }

    const split = harmonyId ? harmonyId.split('#').map(a => `${atob(a)}-${a}`) : undefined;
    return (
         <div>
            <Label label="repository id">
            <Input value={repositoryId} onChange={setRepositoryId}/>
            </Label>
            <Label label="harmony id">
            <Input value={harmonyId} onChange={setHarmonyId}/>
            </Label>
            <Button onClick={onSubmit}>Submit</Button>
            {code.map((c, i) => <div>
                {split ? <p>{split[i]}</p> : null}
                <CodeSnippet language='javascript' code={c} showLineNumbers/>
            </div>)}
        </div>
    );
}
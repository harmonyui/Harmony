'use client';

import { Button } from "@harmony/ui/src/components/core/button";
import { setCookie } from "./server-actions";
import { redirect } from "next/navigation";

export const NewButton = () => {
    return <Button onClick={async () => {
        await setCookie('harmony-user-id', 'none');
        redirect('/');
    }}>New</Button>
}
'use client';

import { Button } from "@harmony/ui/src/components/core/button";
import { setCookie } from "./server-actions";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export const NewButton = () => {
    useEffect(() => {
        async function initialize() {
            await setCookie('harmony-user-id', 'none');
            redirect('/');
        }
        initialize();
    }, [])

    return <></>
}
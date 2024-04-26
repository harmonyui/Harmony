import { redirect } from "next/navigation";
import { withAuth } from "../../../../../utils/protected-routes-hoc";
import { cookies } from "next/headers";
import { Button } from "@harmony/ui/src/components/core/button";
import { setCookie } from "../../../../../utils/server-actions";
import { NewButton } from "../../../../../utils/new-button";

//TODO: Add admin God auth check in layout
const NewAccount = withAuth(async ({ctx}) => {
    if (ctx.session.auth.role !== 'harmony-admin') {
        redirect('/');
    }

    return <NewButton />
})

   

export default NewAccount;
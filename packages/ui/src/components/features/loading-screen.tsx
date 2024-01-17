import { Header } from "../core/header"
import { Spinner } from "../core/spinner"

export const LoadingScreen: React.FunctionComponent<{children: string}> = ({children}) => {
    return (
        <main className="flex min-h-screen flex-col items-center justify-between p-24 bg-[url('/harmony.ai.svg')]">
            <div className="flex flex-col gap-4 bg-white rounded-md py-10 px-20 text-center">
                <Header level={1}>Harmony</Header>
                <p className="mt-4">{children}</p>
                <Spinner className="mx-auto" sizeClass="w-12 h-12"/>
            </div>
        </main>
    )
}
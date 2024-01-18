import { Header } from "../core/header"
import { Spinner } from "../core/spinner"

export const LoadingScreen: React.FunctionComponent<{children: string}> = ({children}) => {
    return (
        <main className="hw-flex hw-min-h-screen hw-flex-col hw-items-center hw-justify-between hw-p-24 hw-bg-[url('/harmony.ai.svg')]">
            <div className="hw-flex hw-flex-col hw-gap-4 hw-bg-white hw-rounded-md hw-py-10 hw-px-20 hw-text-center">
                <Header level={1}>Harmony</Header>
                <p className="hw-mt-4">{children}</p>
                <Spinner className="hw-mx-auto" sizeClass="hw-w-12 hw-h-12"/>
            </div>
        </main>
    )
}
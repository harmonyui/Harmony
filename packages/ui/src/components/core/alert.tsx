import ReactDOM from "react-dom"
import { ClosableContent } from "./closable-content"
import { useEffect, useState } from "react"
import { usePrevious } from "../../hooks/previous";

interface AlertProps {
    label: string | undefined;
    setLabel: (value: string | undefined) => void;
}
export const Alert: React.FunctionComponent<AlertProps> = ({label, setLabel}) => {
    // const [label, setLabel] = useState<string>();
    // const previousLabel = usePrevious(labelProp);

    // useEffect(() => {
    //     if (previousLabel !== labelProp) {
    //         setLabel(labelProp);
    //     }
    // }, [labelProp, previousLabel])

    const onClose = () => {
        setLabel(undefined);
    }
    return ReactDOM.createPortal(Boolean(label) ? <div className="hw-fixed hw-inset-0 hw-z-[100] hw-h-fit">
        <ClosableContent onClose={onClose}>
        <div className="hw-p-4 hw-mb-4 hw-text-sm hw-text-red-800 hw-rounded-lg hw-bg-red-50 dark:hw-bg-gray-800 dark:hw-text-red-400" role="alert">
            <span className="hw-font-medium">Danger!</span> {label}
        </div></ClosableContent>
        </div> : null, document.getElementById("harmony-container") || document.body
    )
}
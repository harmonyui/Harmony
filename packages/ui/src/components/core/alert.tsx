import ReactDOM from "react-dom"
import { ClosableContent } from "./closable-content"
import { useEffect, useState } from "react"
import { usePrevious } from "../../hooks/previous";

interface AlertProps {
    label: string | undefined;
    setLabel: (value: string | undefined) => void;
}
export const Alert: React.FunctionComponent<AlertProps> = ({label: labelProps, setLabel: setLabelProps}) => {
    const [transparency, setTransparency] = useState(1);
    const [label, setLabel] = useState(labelProps);

    useEffect(() => {
        if (Boolean(label)) {
            const decresaseTransparency = (transparency: number) => {
                if (transparency <= 0) {
                    setLabelProps(undefined);
                    return;
                }
                const newTrans = transparency - 0.05
                setTransparency(Math.max(0, newTrans));
                setTimeout(() => decresaseTransparency(newTrans), 50)
            }
            setTransparency(1);
            setTimeout(() => decresaseTransparency(1), 5000);
        }
    }, [label]);

    useEffect(() => {
        if (label !== labelProps) {
            setLabel(labelProps);
        }
    }, [labelProps])

    const onClose = () => {
        setLabelProps(undefined);
    }
    return ReactDOM.createPortal(Boolean(label) ? <div className="hw-fixed hw-bottom-[40px] hw-left-0 hw-right-0 hw-z-[100] hw-h-fit">
        <ClosableContent className="hw-w-[400px] hw-mx-auto hw-fill-white" xMarkClassName="hw-h-2 hw-w-2 hw-fill-white hw-mr-1 -hw-mt-[14px]" onClose={onClose}>
        <div style={{opacity: `${transparency * 100}%`}} className="hw-py-2 hw-px-4 hw-mb-4 hw-text-sm hw-text-white hw-rounded-lg hw-bg-[#FF6565] dark:hw-bg-gray-800 dark:hw-text-red-400" role="alert">
            {label}
        </div></ClosableContent>
        </div> : null, document.getElementById("harmony-container") || document.body
    )
}
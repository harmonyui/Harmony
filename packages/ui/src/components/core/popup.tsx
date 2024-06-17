import { createPortal } from "react-dom";
import { getClass } from "@harmony/util/src/utils/common";
import { ClosableContent } from "./closable-content";
import { useFadeout } from "../../hooks/fadeout";

interface PopupProps {
    children: React.ReactNode;
    show: boolean;
    onClose: () => void;
    fade?: boolean;
    type?: InfoType
}
export const Popup: React.FunctionComponent<PopupProps> = ({ show, onClose, children, fade = false, type = 'base' }) => {
    const transparency = useFadeout({
        fade, onFaded() {
            onClose();
        }
    });

    return createPortal(show ? <div className="hw-fixed hw-bottom-[40px] hw-left-0 hw-right-0 hw-z-[100] hw-h-fit">
        <ClosableContent className="hw-min-w-[400px] hw-w-fit hw-mx-auto hw-fill-white" xMarkClassName={getClass(type === 'base' ? '' : 'hw-fill-white', "hw-h-2 hw-w-2 hw-mr-1 -hw-mt-[14px]")} onClose={onClose}>
            <InfoBox transparency={transparency} type={type}>
                {children}
            </InfoBox>
        </ClosableContent>
    </div> : null, document.getElementById("harmony-container") || document.body
    )
}

export type InfoType = 'danger' | 'info' | 'base';
interface InfoBoxProps {
    children: React.ReactNode;
    transparency?: number;
    type?: InfoType
}
export const InfoBox: React.FunctionComponent<InfoBoxProps> = ({ children, transparency, type = 'base' }) => {
    const colors = {
        danger: 'hw-bg-[#FF6565] hw-text-white',
        info: 'hw-bg-[#FFE9BE] hw-text-[#11283B]',
        base: 'hw-bg-white hw-text-gray-900'
    }
    const color = colors[type];

    return (
        <div style={{ opacity: `${(transparency || 1) * 100}%` }} className={getClass("hw-py-2 hw-px-4 hw-mb-4 hw-text-sm hw-rounded-lg", color)} role="alert">
            {children}
        </div>
    )
}
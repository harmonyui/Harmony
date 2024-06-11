import { useEffect, useState } from "react"
import { InfoType, Popup } from "./popup";


interface NotificationProps {
    label: string | undefined;
    setLabel: (value: string | undefined) => void;
    type: InfoType
}
export const Notification: React.FunctionComponent<NotificationProps> = ({ label: labelProps, setLabel: setLabelProps, type }) => {
    const [label, setLabel] = useState(labelProps);

    useEffect(() => {
        if (label !== labelProps) {
            setLabel(labelProps);
        }
    }, [labelProps])

    const onClose = () => {
        setLabelProps(undefined);
    }
    return <Popup show={Boolean(label)} onClose={onClose} type={type} fade={Boolean(label)}>
        {label}
    </Popup>

}
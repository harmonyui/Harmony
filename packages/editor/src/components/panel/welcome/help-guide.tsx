import { ArrowLeftIcon, IconComponent, QuestionMarkIcon, SendIcon } from "@harmony/ui/src/components/core/icons"
import { getWebUrl } from "@harmony/util/src/utils/component";
import { getClass } from '@harmony/util/src/utils/common';
import { Popover } from "@harmony/ui/src/components/core/popover"
import { useMemo, useState } from "react";
import { Button } from "@harmony/ui/src/components/core/button";
import { useHarmonyContext } from "../../harmony-provider";
import { ControlModal } from "./welcome-modal";
import { HarmonyModal } from "@harmony/ui/src/components/core/modal";
import { Header } from "@harmony/ui/src/components/core/header";
import { Label } from "@harmony/ui/src/components/core/label";
import { Input } from "@harmony/ui/src/components/core/input";
import { emailSchema } from "@harmony/util/src/types/utils";
import { EmailFeedbackRequest, EmailMeetingRequest } from "@harmony/util/src/types/network";

export const HelpGuide: React.FunctionComponent<{className?: string}> = ({className}) => {
    const {setShowGiveFeedback} = useHarmonyContext();
    const [otherPopup, setOtherPopup] = useState<'condensed' | 'talk' | undefined>();

    const [showPopover, setShowPopover] = useState(false);
    const [closeTrigger, setCloseTrigger] = useState(0);
    const [showControlModal, setShowControlModal] = useState(false);

    const onOpen = () => {
        setShowPopover(!showPopover);
    }

    const onGuideClick = () => {
        setShowControlModal(true);
        onClosePopup();
    }

    const onClosePopup = () => {
        setShowPopover(false);
        setOtherPopup(undefined);
    }

    const popup = otherPopup ? {
        'condensed': <HelpGuideCondensed onGuideClick={onGuideClick}/>,
        'talk': <TalkWithUs onAfterSend={onClosePopup}/>
    }[otherPopup] : <div className="hw-flex hw-flex-col hw-gap-2 hw-mr-4">
        <div className="hover:hw-cursor-pointer hover:hw-text-[#88939D] hw-text-[#11283B]" onClick={() => setOtherPopup('condensed')}>View hotkey guide</div>
        <div className="hover:hw-cursor-pointer hover:hw-text-[#88939D] hw-text-[#11283B]" onClick={() => {
            setShowPopover(false);
            setShowGiveFeedback(true)
        }}>Give us feedback</div>
        <div className="hover:hw-cursor-pointer hover:hw-text-[#88939D] hw-text-[#11283B]" onClick={() => setOtherPopup('talk')}>Talk with us</div>
    </div>
	return (<>
		<Popover closeTrigger={closeTrigger} isOpen={showPopover} setIsOpen={(value) => {
            setOtherPopup(undefined);
            setShowPopover(value);
        }} button={<ButtonIcon className={className} icon={QuestionMarkIcon} onClick={onOpen}/>} container={document.getElementById("harmony-container") || undefined}>
			{popup}
		</Popover>
        <ControlModal show={showControlModal} onClose={() => setShowControlModal(false)}/>
	</>)
}

const HelpGuideCondensed: React.FunctionComponent<{onGuideClick: () => void;}> = ({onGuideClick}) => {
    return (<div className="hw-flex hw-flex-col hw-gap-2 hw-items-center">
        <div className="hw-grid hw-grid-cols-4 hw-gap-y-4">
            <div className="hw-col-span-3">Toggle Navigation/ Designer modes</div>
            <div className="hw-col-span-1 hw-text-center">[T]</div>

            <div className="hw-col-span-3">Move to parent component</div>
            <div className="hw-col-span-1 hw-text-center">[Esc]</div>

            <div className="hw-col-span-3">Drag smoothly along axis</div>
            <div className="hw-col-span-1 hw-text-center">[Shift]</div>

            <div className="hw-col-span-3">Interact with selected component</div>
            <div className="hw-col-span-1 hw-text-center">[Alt]</div>

            <div className="hw-col-span-3">Toggle component flex</div>
            <div className="hw-col-span-1 hw-text-center">[F]</div>
        </div>
        <Button onClick={onGuideClick}>View full guide</Button>
    </div>)
}

const TalkWithUs: React.FunctionComponent<{onAfterSend: () => void;}> = ({onAfterSend}) => {
    const {environment} = useHarmonyContext();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const WEB_URL = useMemo(() => getWebUrl(environment), [environment]);

    const onSend = () => {
        if (!name || !email || !comments) {
            setError('Please fill out all fields');
            return;
        }
        const emailParse = emailSchema.safeParse(email);
        if (!emailParse.success) {
            setError('Invalid email');
            return;
        }

        const request: EmailMeetingRequest = {
            name: name, email: emailParse.data, comments
        }
        setLoading(true);
        fetch(`${WEB_URL}/api/email/meeting`, {
            method: 'POST',
            body: JSON.stringify(request)
        }).then((res) => {
            if (!res.ok) {
                setError("There was an error sending feedback");
            } else {
                setError('');
                onAfterSend();
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
            setError("There was an error setting up a meeting");
        });
    }

    return (<div className="hw-flex hw-flex-col hw-min-w-[300px]">
        <div className="hw-border-b">
            <Header level={3}>Contact Us:</Header>
        </div>
        <a className="hw-text-blue-500" href="mailto:jacob@harmonyui.app">jacob@harmonyui.app</a>
        <div className="hw-border-b hw-mt-2">
            <Header level={3}>Request a meeting:</Header>
        </div>
        <Label label="Name:">
            <Input className="hw-w-full" value={name} onChange={setName}/>
        </Label>
        <Label label="Email:">
            <Input className="hw-w-full" value={email} onChange={setEmail}/>
        </Label>
        <Label label="Comments:">
            <Input type='textarea' className="hw-w-full" value={comments} onChange={setComments}/>
        </Label>
        {error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
        <Button className="hw-ml-auto" onClick={onSend} loading={loading}>Request <SendIcon className="hw-h-5 hw-w-5"/></Button>
    </div>)
}

export const GiveFeedbackModal: React.FunctionComponent<{show: boolean, onClose: () => void}> = ({show, onClose}) => {
    const {environment} = useHarmonyContext();
    const [name, setName] = useState('');
    const [comments, setComments] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const WEB_URL = useMemo(() => getWebUrl(environment), [environment]);

    const onSend = () => {
        if (!name ||  !comments) {
            setError('Please fill out all fields');
            return;
        }
        const request: EmailFeedbackRequest = {
            name, comments: comments
        }
        setLoading(true);
        //TODO: Put this somewhere else in an encapsulated network layer
        fetch(`${WEB_URL}/api/email/feedback`, {
            method: 'POST',
            body: JSON.stringify(request)
        }).then((res) => {
            if (!res.ok) {
                setError("There was an error sending feedback");
            } else {
                setError('');
                onClose();
            }
            setLoading(false);
        }).catch(() => {
            setLoading(false);
            setError("There was an error sending feedback");
        });
    }

    return (
        <HarmonyModal show={show} onClose={onClose} editor>
            <Header level={3}>We want to hear from you! How could Harmony help you and your team? Any feature requests?</Header>
            <div className="hw-flex hw-flex-col hw-gap-2">
                <Label label="Name:">
                    <Input className="hw-w-full" value={name} onChange={setName}/>
                </Label>
                <Label label="Comments:">
                    <Input className="hw-w-full" type='textarea' value={comments} onChange={setComments}/>
                </Label>
                {error ? <p className="hw-text-sm hw-text-red-400">{error}</p> : null}
                <Button className="hw-ml-auto" onClick={onSend} loading={loading}>Send Feedback <SendIcon className="hw-h-5 hw-w-5"/></Button>
            </div>
        </HarmonyModal>
    )
}

interface ButtonIconProps {
	icon: IconComponent;
	className?: string;
	onClick?: () => void;
}
const ButtonIcon: React.FunctionComponent<ButtonIconProps> = ({icon: Icon, className, onClick}) => {
	return (
		<Icon className={getClass("hw-h-8 hw-w-8 hw-fill-white hw-stroke-none", className)} onClick={onClick}/>
	)
}
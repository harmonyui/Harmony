/* eslint-disable @typescript-eslint/no-shadow -- ok*/
import { Button } from "@harmony/ui/src/components/core/button";
import { Header } from "@harmony/ui/src/components/core/header";
import { GitBranchIcon, PreviewIcon, SendIcon } from "@harmony/ui/src/components/core/icons";
import { Input } from "@harmony/ui/src/components/core/input";
import { Label } from "@harmony/ui/src/components/core/label";
import { HarmonyModal } from "@harmony/ui/src/components/core/modal";
import { useChangeProperty } from "@harmony/ui/src/hooks/change-property";
import type { PullRequest } from "@harmony/util/src/types/branch";
import type { PublishRequest } from "@harmony/util/src/types/network";
import { useState } from "react";
import { useHarmonyContext } from "../harmony-context";
import { useHarmonyStore } from "../hooks/state";

export const PublishButton: React.FunctionComponent<{preview?: boolean}> = ({preview=false}) => {
	const {changeMode, isSaving, setError: setErrorProps} = useHarmonyContext();
	const updatePublishState = useHarmonyStore(state => state.updatePullRequest);
	const publishState = useHarmonyStore(state => state.pullRequest);
	const pullRequestProps = useHarmonyStore(state => state.pullRequest);
	const branchId = useHarmonyStore(state => state.currentBranch.id);
	const isDemo = useHarmonyStore(state => state.isDemo);
	const publish = useHarmonyStore(state => state.publishChanges);
	const currentBranch = useHarmonyStore(state => state.currentBranch);

	const [show, setShow] = useState(false);
	const changeProperty = useChangeProperty<PullRequest>(updatePublishState);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const pullRequest: PullRequest = publishState || {id: '', title: '', body: '', url: ''}

	const isPublished = Boolean(pullRequestProps)

	const onNewPullRequest = () => {
		if (!validate()) return;

        void sendPullRequest(pullRequest).then((published) => {
			if (published) {
				window.open(published.pullRequest.url, '_blank')?.focus();
			} else {
				setErrorProps('There was an error when publishing');
			}
		})
	}

	const sendPullRequest = async (pullRequest: PullRequest) => {
		setLoading(true);
		const request: PublishRequest = {
			branchId,
			pullRequest
		}
		const published = await publish(request);
		setLoading(false);
		setShow(false);
		if (!published) {
			setError('There was an error when publishing');
		}
		
		return published;
	}

	const onPreview = () => {
		if (!validate()) return;
		changeMode('preview')
	}

	const validate = (): boolean => {
		if (!pullRequest.body || !pullRequest.title) {
			setError('Please fill out all fields');
			return false;
		}

		return true;
	}

	const onClose = () => {
		setShow(false);
		setError('');
	}

	const onViewCode = () => {
		if (!currentBranch.id) return;

		if (isSaving) {
			setErrorProps("Please wait to finish saving before publishing");
			return;
		}

		const pullRequest: PullRequest = {
			id: '',
			title: currentBranch.name,
			body: '',
			url: ''
		}
		if (!pullRequestProps) {
			void sendPullRequest(pullRequest).then((published) => {
				if (published) {
					window.open(published.pullRequest.url, '_blank')?.focus();
				} else {
					setErrorProps('There was an error viewing the code');
				}
			})
		} else {
			window.open(pullRequestProps.url, '_blank')?.focus();
		}
	}

	const onPublishClick = () => {
		if (isSaving) {
			setErrorProps("Please wait to finish saving before publishing");
			return;
		}
		setShow(true);
	}

	if (isDemo || isPublished) {
		return <Button mode="dark" className="hw-h-7 hw-px-8" onClick={onViewCode} loading={loading} disabled={!currentBranch}>View Code</Button>
	}

	return <>
		<Button mode="dark" className="hw-h-7 hw-px-8" onClick={onPublishClick} disabled={isPublished}>Publish</Button>
		<HarmonyModal show={show} onClose={onClose} editor>
			<div className="hw-flex hw-gap-2 hw-items-center">
				<GitBranchIcon className="hw-w-6 hw-h-6"/>
				<Header level={3}>Create a Publish Request</Header>
			</div>
			<div className="hw-mt-2 hw-max-w-xl hw-text-sm hw-text-gray-500">
				<p>Fill out the following fields to create a new request to publish your changes</p>
			</div>
			<div className="hw-grid hw-grid-cols-1 hw-gap-x-6 hw-gap-y-4 sm:hw-grid-cols-6 hw-my-2">
				<Label className="sm:hw-col-span-full" label="Title:">
					<Input className="hw-w-full" value={pullRequest.title} onChange={changeProperty.formFunc('title', pullRequest)}/>
				</Label>
                <Label className="sm:hw-col-span-full" label="Publish Details:">
					<Input className="hw-w-full" type="textarea" value={pullRequest.body} onChange={changeProperty.formFunc('body', pullRequest)}/>
				</Label>
			</div>
			{error ? <p className="hw-text-red-400 hw-text-sm">{error}</p> : null}
			<div className="hw-flex hw-justify-between">
				{preview ? <Button onClick={onPreview}>Preview Changes <PreviewIcon className="hw-ml-1 hw-h-4 hw-w-4"/></Button> : null}
				<Button onClick={onNewPullRequest} loading={loading}>Send Request <SendIcon className="hw-ml-1 hw-h-5 hw-w-5"/></Button>
			</div>
		</HarmonyModal>
	</>
}
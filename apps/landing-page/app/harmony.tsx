'use client'

import { HarmonySetup } from 'harmony-ai-editor/src'
import { uploadImage } from './actions'
import { PricingCard } from './components/pricing-card'

export const Harmony = () => {
  return process.env.ENV !== 'production' ? (
    <HarmonySetup
      repositoryId={process.env.REPOSITORY_ID}
      uploadImage={uploadImage}
      components={[
        {
          name: 'PricingCard',
          component: PricingCard as React.FunctionComponent,
          defaultProps: {
            title: 'Title',
            description: 'Description',
            link: 'https://harmony.sh',
          },
          implementation:
            '<PricingCard title="Title" description="Description" link="https://harmony.sh" />',
          props: [],
          dependencies: [],
        },
      ]}
    />
  ) : null
}

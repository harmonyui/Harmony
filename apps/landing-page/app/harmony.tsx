'use client'

import { HarmonySetup } from 'harmony-ai-editor/src'
import { uploadImage } from './actions'
import { PricingCard } from './components/pricing-card'

export const Harmony = () => {
  return process.env.ENV !== 'production' ? (
    <HarmonySetup
      repositoryId='da286f25-b5de-4003-94ed-2944162271ed'
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
      user={{
        id: '123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        imageUrl: 'https://example.com/image.png',
      }}
    />
  ) : null
}

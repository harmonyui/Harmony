import { formatDollarAmount, getClass } from '@harmony/util/src/utils/common'

interface PricingItem {
  title: string
  description: string
  price?: number
  features?: string[]
  custom?: boolean
  popular?: boolean
}
export const PricingCard: React.FunctionComponent<PricingItem> = ({
  title,
  description,
  price = 0,
  features = [],
  custom = false,
  popular = false,
}) => {
  return (
    <div
      className={getClass(
        'hw-relative hw-flex hw-max-w-[400px] hw-flex-col hw-gap-8 hw-rounded-2xl hw-border hw-p-4 hw-text-black dark:hw-text-white hw-overflow-hidden',
        popular
          ? 'hw-border-2 hw-border-[var(--color-one)] dark:hw-border-[var(--color-one)]'
          : '',
      )}
    >
      <div className='hw-flex hw-items-center'>
        <div className='hw-ml-4'>
          <h2 className='hw-text-base hw-font-semibold hw-leading-7'>
            {title}
          </h2>
          <p className='hw-h-12 hw-text-sm hw-leading-5 hw-text-black/70 dark:hw-text-white'>
            {description}
          </p>
        </div>
      </div>
      <div
        className='hw-flex hw-flex-row hw-gap-1'
        style={{ opacity: '1', transform: 'none' }}
      >
        <span className='hw-text-4xl hw-font-bold hw-text-black dark:hw-text-white'>
          {!custom ? (
            <>
              {formatDollarAmount(price)}
              <span className='hw-text-xs'> / user / month</span>
            </>
          ) : (
            'Custom'
          )}
        </span>
      </div>
      <button className='hw-inline-flex hw-items-center hw-justify-center hw-whitespace-nowrap hw-rounded-md focus-visible:hw-outline-none focus-visible:hw-ring-1 focus-visible:hw-ring-ring disabled:hw-pointer-events-none disabled:hw-opacity-50 hw-bg-primary hw-text-primary-foreground hw-shadow hover:hw-bg-primary/90 hw-h-9 hw-px-4 hw-py-2 hw-group hw-relative hw-w-full hw-gap-2 hw-overflow-hidden hw-text-lg hw-font-semibold hw-tracking-tighter hw-transform-gpu hw-ring-offset-current hw-transition-all hw-duration-300 hw-ease-out hover:hw-ring-2 hover:hw-ring-primary hover:hw-ring-offset-2'>
        <span className='hw-absolute hw-right-0 -hw-mt-12 hw-h-32 hw-w-8 hw-translate-x-12 hw-rotate-12 hw-transform-gpu hw-bg-white hw-opacity-10 hw-transition-all hw-duration-1000 hw-ease-out group-hover:-hw-translate-x-96 dark:hw-bg-black'></span>
        <p>{custom ? 'Contact Sales' : 'Subscribe'}</p>
      </button>
      {!custom ? (
        <>
          <hr className='hw-m-0 hw-h-px hw-w-full hw-border-none hw-bg-gradient-to-r hw-from-neutral-200/0 hw-via-neutral-500/30 hw-to-neutral-200/0' />
          <ul className='hw-flex hw-flex-col hw-gap-2 hw-font-normal'>
            {features.map((feature) => (
              <li
                key={feature}
                className='hw-flex hw-items-center hw-gap-3 hw-text-xs hw-font-medium hw-text-black dark:hw-text-white'
              >
                <svg
                  width='15'
                  height='15'
                  viewBox='0 0 15 15'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='hw-h-5 hw-w-5 hw-shrink-0 hw-rounded-full hw-bg-green-400 hw-p-[2px] hw-text-black dark:hw-text-white'
                >
                  <path
                    d='M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z'
                    fill='currentColor'
                    fillRule='evenodd'
                    clipRule='evenodd'
                  ></path>
                </svg>
                <span className='hw-flex'>{feature}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

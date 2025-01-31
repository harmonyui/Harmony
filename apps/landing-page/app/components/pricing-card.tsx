import { formatDollarAmount, getClass } from '@harmony/util/src/utils/common'

interface PricingItem {
  title: string
  description: string
  link: string
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
  link,
}) => {
  return (
    <div
      className={getClass(
        'relative flex max-w-[400px] flex-col gap-8 rounded-2xl border p-4 text-black dark:text-white overflow-hidden',
        popular
          ? 'border-2 border-[var(--color-one)] dark:border-[var(--color-one)]'
          : '',
      )}
    >
      <div className='flex items-center'>
        <div className='ml-4'>
          <h2 className='text-base font-semibold leading-7'>{title}</h2>
          <p className='h-12 text-sm leading-5 text-black/70 dark:text-white'>
            {description}
          </p>
        </div>
      </div>
      <div
        className='flex flex-row gap-1'
        style={{ opacity: '1', transform: 'none' }}
      >
        <span className='text-4xl font-bold text-black dark:text-white'>
          {!custom ? (
            <>
              {formatDollarAmount(price)}
              <span className='text-xs'> / user / month</span>
            </>
          ) : (
            'Custom'
          )}
        </span>
      </div>
      <a
        href={link}
        target='_blank'
        className='inline-flex items-center justify-center whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-2'
      >
        <span className='absolute right-0 -mt-12 h-32 w-8 translate-x-12 rotate-12 transform-gpu bg-white opacity-10 transition-all duration-1000 ease-out group-hover:-translate-x-96 dark:bg-black'></span>
        <p>{custom ? 'Contact Sales' : 'Subscribe'}</p>
      </a>
      {!custom ? (
        <>
          <hr className='m-0 h-px w-full border-none bg-gradient-to-r from-neutral-200/0 via-neutral-500/30 to-neutral-200/0' />
          <ul className='flex flex-col gap-2 font-normal'>
            {features.map((feature) => (
              <li
                key={feature}
                className='flex items-center gap-3 text-xs font-medium text-black dark:text-white'
              >
                <svg
                  width='15'
                  height='15'
                  viewBox='0 0 15 15'
                  fill='none'
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 shrink-0 rounded-full bg-green-400 p-[2px] text-black dark:text-white'
                >
                  <path
                    d='M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z'
                    fill='currentColor'
                    fillRule='evenodd'
                    clipRule='evenodd'
                  ></path>
                </svg>
                <span className='flex'>{feature}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  )
}

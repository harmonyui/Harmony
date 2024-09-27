import { Button } from './button'
import { Container } from './container'
import { Gradient } from './gradient'
import { Link } from './link'
import { Subheading } from './text'
import { PlusGrid, PlusGridItem, PlusGridRow } from '@/components/plus-grid'

function CallToAction() {
  return (
    <div className='hw-relative hw-pb-16 hw-pt-20 hw-text-center sm:hw-py-24'>
      <hgroup>
        <Subheading>Get started</Subheading>
        <p className='hw-mt-6 hw-text-3xl hw-font-medium hw-tracking-tight hw-text-gray-950 dark:hw-text-white sm:hw-text-5xl'>
          Ready to dive in?
          <br />
          Start your free trial today.
        </p>
      </hgroup>
      <p className='hw-mx-auto hw-mt-6 hw-max-w-xs hw-text-sm/6 hw-text-gray-500 dark:hw-text-gray-300'>
        Get the tools you need to build better websites and applications faster.
      </p>
      <div className='hw-mt-6'>
        <Button className='hw-w-full sm:hw-w-auto' href='#'>
          Get started
        </Button>
      </div>
    </div>
  )
}

function SitemapHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className='hw-text-sm/6 hw-font-medium hw-text-gray-950/50 dark:hw-text-white'>
      {children}
    </h3>
  )
}

function SitemapLinks({ children }: { children: React.ReactNode }) {
  return <ul className='hw-mt-6 hw-space-y-4 hw-text-sm/6'>{children}</ul>
}

function SitemapLink(props: React.ComponentPropsWithoutRef<typeof Link>) {
  return (
    <li>
      <Link
        {...props}
        className='hw-font-medium hw-text-gray-950 data-[hover]:hw-text-gray-950/75 dark:hw-text-gray-400 data-[hover]:dark:hw-text-gray-200'
      />
    </li>
  )
}

function Sitemap() {
  return (
    <>
      <div>
        <SitemapHeading>Product</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href='/pricing'>Pricing</SitemapLink>
          <SitemapLink href='#'>Analysis</SitemapLink>
          <SitemapLink href='#'>API</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Company</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href='#'>Careers</SitemapLink>
          <SitemapLink href='/blog'>Blog</SitemapLink>
          <SitemapLink href='/company'>Company</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Support</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href='#'>Help center</SitemapLink>
          <SitemapLink href='#'>Community</SitemapLink>
        </SitemapLinks>
      </div>
      <div>
        <SitemapHeading>Company</SitemapHeading>
        <SitemapLinks>
          <SitemapLink href='#'>Terms of service</SitemapLink>
          <SitemapLink href='#'>Privacy policy</SitemapLink>
        </SitemapLinks>
      </div>
    </>
  )
}

function SocialIconX(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox='0 0 16 16' fill='currentColor' {...props}>
      <path d='M12.6 0h2.454l-5.36 6.778L16 16h-4.937l-3.867-5.594L2.771 16H.316l5.733-7.25L0 0h5.063l3.495 5.114L12.6 0zm-.86 14.376h1.36L4.323 1.539H2.865l8.875 12.837z' />
    </svg>
  )
}

function SocialIconFacebook(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox='0 0 16 16' fill='currentColor' {...props}>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M16 8.05C16 3.603 12.418 0 8 0S0 3.604 0 8.05c0 4.016 2.926 7.346 6.75 7.95v-5.624H4.718V8.05H6.75V6.276c0-2.017 1.194-3.131 3.022-3.131.875 0 1.79.157 1.79.157v1.98h-1.008c-.994 0-1.304.62-1.304 1.257v1.51h2.219l-.355 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.95z'
      />
    </svg>
  )
}

function SocialIconLinkedIn(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox='0 0 16 16' fill='currentColor' {...props}>
      <path d='M14.82 0H1.18A1.169 1.169 0 000 1.154v13.694A1.168 1.168 0 001.18 16h13.64A1.17 1.17 0 0016 14.845V1.15A1.171 1.171 0 0014.82 0zM4.744 13.64H2.369V5.996h2.375v7.644zm-1.18-8.684a1.377 1.377 0 11.52-.106 1.377 1.377 0 01-.527.103l.007.003zm10.075 8.683h-2.375V9.921c0-.885-.015-2.025-1.234-2.025-1.218 0-1.425.966-1.425 1.968v3.775H6.233V5.997H8.51v1.05h.032c.317-.601 1.09-1.235 2.246-1.235 2.405-.005 2.851 1.578 2.851 3.63v4.197z' />
    </svg>
  )
}

function SocialLinks() {
  return (
    <>
      <Link
        href='https://facebook.com'
        target='_blank'
        aria-label='Visit us on Facebook'
        className='hw-text-gray-950 data-[hover]:hw-text-gray-950/75 dark:hw-text-white data-[hover]:dark:hw-text-white/75'
      >
        <SocialIconFacebook className='hw-size-4' />
      </Link>
      <Link
        href='https://x.com'
        target='_blank'
        aria-label='Visit us on X'
        className='hw-text-gray-950 data-[hover]:hw-text-gray-950/75 dark:hw-text-white data-[hover]:dark:hw-text-white/75'
      >
        <SocialIconX className='hw-size-4' />
      </Link>
      <Link
        href='https://linkedin.com'
        target='_blank'
        aria-label='Visit us on LinkedIn'
        className='hw-text-gray-950 data-[hover]:hw-text-gray-950/75 dark:hw-text-white data-[hover]:dark:hw-text-white/75'
      >
        <SocialIconLinkedIn className='hw-size-4' />
      </Link>
    </>
  )
}

function Copyright() {
  return (
    <div className='hw-text-sm/6 hw-text-gray-950 dark:hw-text-white'>
      &copy; {new Date().getFullYear()} Harmony UI
    </div>
  )
}

export function Footer() {
  return (
    <footer>
      <Gradient className='hw-relative'>
        <div className='hw-absolute hw-inset-2 hw-rounded-3xl hw-bg-background/80' />
        <Container>
          <CallToAction />
          <PlusGrid className='hw-pb-16'>
            <PlusGridRow>
              <div className='hw-grid hw-grid-cols-2 hw-gap-y-10 hw-pb-6 lg:hw-grid-cols-6 lg:hw-gap-8'>
                <div className='hw-col-span-2 hw-flex'>
                  <PlusGridItem className='hw-pt-6 lg:hw-pb-6'>
                    <div className='hw-flex-col hw-flex hw-gap-4'>
                      <a className='hw-flex hw-items-center hw-gap-2' href='/'>
                        <img
                          src='/icon-128.png'
                          className='hw-h-8 hw-w-8 hw-text-primary dark:hw-hidden'
                        />
                        <img
                          src='/icon-dark-128.png'
                          className='hw-h-8 hw-w-8 hw-text-primary hw-hidden dark:hw-inline-block'
                        />
                        <span className='hw-self-center hw-text-2xl hw-font-semibold hw-whitespace-nowrap dark:hw-text-white'>
                          Harmony UI
                        </span>
                      </a>
                      <p className='hw-max-w-xs hw-text-secondary-foreground'>
                        Become a visual developer
                      </p>
                    </div>
                  </PlusGridItem>
                </div>
                <div className='hw-col-span-2 hw-grid hw-grid-cols-2 hw-gap-x-8 hw-gap-y-12 lg:hw-col-span-4 lg:hw-grid-cols-subgrid lg:hw-pt-6'>
                  <Sitemap />
                </div>
              </div>
            </PlusGridRow>
            <PlusGridRow className='hw-flex hw-justify-between'>
              <div>
                <PlusGridItem className='hw-py-3'>
                  <Copyright />
                </PlusGridItem>
              </div>
              <div className='hw-flex'>
                <PlusGridItem className='hw-flex hw-items-center hw-gap-8 hw-py-3'>
                  <SocialLinks />
                </PlusGridItem>
              </div>
            </PlusGridRow>
          </PlusGrid>
        </Container>
      </Gradient>
    </footer>
  )
}

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  RssIcon,
} from '@heroicons/react/16/solid'
import { clsx } from 'clsx'
import dayjs from 'dayjs'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { image } from '../../../sanity/image'
import {
  getCategories,
  getFeaturedPosts,
  getPosts,
  getPostsCount,
} from '../../../sanity/queries'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { GradientBackground } from '@/components/gradient'
import { Link } from '@/components/link'
import { Heading, Lead, Subheading } from '@/components/text'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Stay informed with product updates, company news, and insights on how to sell smarter at your company.',
}

const postsPerPage = 5

async function FeaturedPosts() {
  const featuredPosts = await getFeaturedPosts(3)

  if (featuredPosts.length === 0) {
    return
  }

  return (
    <div className='hw-mt-16 hw-bg-gradient-to-t hw-from-gray-100 dark:hw-from-gray-800 hw-pb-14 hw-animate-fade-in hw-opacity-0 [--animation-delay:600ms]'>
      <Container>
        <h2 className='hw-text-2xl hw-font-medium hw-tracking-tight'>
          Featured
        </h2>
        <div className='hw-mt-6 hw-grid hw-grid-cols-1 hw-gap-8 lg:hw-grid-cols-3'>
          {featuredPosts.map((post) => (
            <div
              key={post.slug}
              className='hw-relative hw-flex hw-flex-col hw-rounded-3xl hw-bg-white dark:hw-bg-gray-950 hw-p-2 hw-shadow-md hw-shadow-black/5 hw-ring-1 hw-ring-black/5'
            >
              {post.mainImage && (
                <img
                  alt={post.mainImage.alt || ''}
                  src={image(post.mainImage).size(1170, 780).url()}
                  className='hw-aspect-[3/2] hw-w-full hw-rounded-2xl hw-object-cover'
                />
              )}
              <div className='hw-flex hw-flex-1 hw-flex-col hw-p-8'>
                <div className='hw-text-sm/5 hw-text-gray-700 dark:hw-text-white'>
                  {dayjs(post.publishedAt).format('dddd, MMMM D, YYYY')}
                </div>
                <div className='hw-mt-2 hw-text-base/7 hw-font-medium dark:hw-text-white'>
                  <Link href={`/blog/${post.slug}`}>
                    <span className='hw-absolute hw-inset-0' />
                    {post.title}
                  </Link>
                </div>
                <div className='hw-mt-2 hw-flex-1 hw-text-sm/6 hw-text-gray-500 dark:hw-text-gray-300'>
                  {post.excerpt}
                </div>
                {post.author && (
                  <div className='hw-mt-6 hw-flex hw-items-center hw-gap-3'>
                    {post.author.image && (
                      <img
                        alt=''
                        src={image(post.author.image).size(64, 64).url()}
                        className='hw-aspect-square hw-size-6 hw-rounded-full hw-object-cover'
                      />
                    )}
                    <div className='hw-text-sm/5 hw-text-gray-700 dark:hw-text-white'>
                      {post.author.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}

async function Categories({ selected }: { selected?: string }) {
  const categories = await getCategories()

  if (categories.length === 0) {
    return
  }

  return (
    <div className='hw-flex hw-flex-wrap hw-items-center hw-justify-between hw-gap-2'>
      <Menu as='div'>
        <MenuButton className='hw-flex hw-items-center hw-justify-between hw-gap-2 hw-font-medium'>
          {categories.find(({ slug }) => slug === selected)?.title ||
            'All categories'}
          <ChevronUpDownIcon className='hw-size-4 hw-fill-slate-900' />
        </MenuButton>
        <MenuItems
          anchor='bottom start'
          className='hw-min-w-40 hw-rounded-lg hw-bg-white hw-p-1 hw-shadow-lg hw-ring-1 hw-ring-gray-200 [--anchor-gap:6px] [--anchor-offset:-4px] [--anchor-padding:10px]'
        >
          <MenuItem>
            <Link
              href='/blog'
              data-selected={selected === undefined ? true : undefined}
              className='hw-group hw-grid hw-grid-cols-[1rem,1fr] hw-items-center hw-gap-2 hw-rounded-md hw-px-2 hw-py-1 data-[focus]:hw-bg-gray-950/5'
            >
              <CheckIcon className='hw-hidden hw-size-4 group-data-[selected]:hw-block' />
              <p className='hw-col-start-2 hw-text-sm/6'>All categories</p>
            </Link>
          </MenuItem>
          {categories.map((category) => (
            <MenuItem key={category.slug}>
              <Link
                href={`/blog?category=${category.slug}`}
                data-selected={category.slug === selected ? true : undefined}
                className='hw-group hw-grid hw-grid-cols-[16px,1fr] hw-items-center hw-gap-2 hw-rounded-md hw-px-2 hw-py-1 data-[focus]:hw-bg-gray-950/5'
              >
                <CheckIcon className='hw-hidden hw-size-4 group-data-[selected]:hw-block' />
                <p className='hw-col-start-2 hw-text-sm/6'>{category.title}</p>
              </Link>
            </MenuItem>
          ))}
        </MenuItems>
      </Menu>
      <Button variant='outline' href='/blog/feed.xml' className='hw-gap-1'>
        <RssIcon className='hw-size-4' />
        RSS Feed
      </Button>
    </div>
  )
}

async function Posts({ page, category }: { page: number; category?: string }) {
  const posts = await getPosts(
    (page - 1) * postsPerPage,
    page * postsPerPage,
    category,
  )

  if (posts.length === 0 && (page > 1 || category)) {
    notFound()
  }

  if (posts.length === 0) {
    return <p className='hw-mt-6 hw-text-gray-500'>No posts found.</p>
  }

  return (
    <div className='hw-mt-6'>
      {posts.map((post) => (
        <div
          key={post.slug}
          className='hw-relative hw-grid hw-grid-cols-1 hw-border-b hw-border-b-gray-100 dark:hw-border-b-gray-800 hw-py-10 first:hw-border-t first:hw-border-t-gray-200 first:dark:hw-border-t-gray-700 max-sm:hw-gap-3 sm:hw-grid-cols-3'
        >
          <div>
            <div className='hw-text-sm/5 max-sm:hw-text-gray-700 sm:hw-font-medium'>
              {dayjs(post.publishedAt).format('dddd, MMMM D, YYYY')}
            </div>
            {post.author && (
              <div className='hw-mt-2.5 hw-flex hw-items-center hw-gap-3'>
                {post.author.image && (
                  <img
                    alt=''
                    src={image(post.author.image).width(64).height(64).url()}
                    className='hw-aspect-square hw-size-6 hw-rounded-full hw-object-cover'
                  />
                )}
                <div className='hw-text-sm/5 hw-text-gray-700 dark:hw-text-white'>
                  {post.author.name}
                </div>
              </div>
            )}
          </div>
          <div className='sm:hw-col-span-2 sm:hw-max-w-2xl'>
            <h2 className='hw-text-sm/5 hw-font-medium'>{post.title}</h2>
            <p className='hw-mt-3 hw-text-sm/6 hw-text-gray-500 dark:hw-text-gray-300'>
              {post.excerpt}
            </p>
            <div className='hw-mt-4'>
              <Link
                href={`/blog/${post.slug}`}
                className='hw-flex hw-items-center hw-gap-1 hw-text-sm/5 hw-font-medium dark:hw-text-white'
              >
                <span className='hw-absolute hw-inset-0' />
                Read more
                <ChevronRightIcon className='hw-size-4 hw-fill-gray-400' />
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

async function Pagination({
  page,
  category,
}: {
  page: number
  category?: string
}) {
  function url(_page: number) {
    const params = new URLSearchParams()

    if (category) params.set('category', category)
    if (_page > 1) params.set('page', _page.toString())

    return params.size !== 0 ? `/blog?${params.toString()}` : '/blog'
  }

  const totalPosts = await getPostsCount(category)
  const hasPreviousPage = page - 1
  const previousPageUrl = hasPreviousPage ? url(page - 1) : undefined
  const hasNextPage = page * postsPerPage < totalPosts
  const nextPageUrl = hasNextPage ? url(page + 1) : undefined
  const pageCount = Math.ceil(totalPosts / postsPerPage)

  if (pageCount < 2) {
    return
  }

  return (
    <div className='hw-mt-6 hw-flex hw-items-center hw-justify-between hw-gap-2'>
      <Button
        variant='outline'
        href={previousPageUrl}
        disabled={!previousPageUrl}
      >
        <ChevronLeftIcon className='hw-size-4' />
        Previous
      </Button>
      <div className='hw-flex hw-gap-2 max-sm:hw-hidden'>
        {Array.from({ length: pageCount }, (_, i) => (
          <Link
            key={i + 1}
            href={url(i + 1)}
            data-active={i + 1 === page ? true : undefined}
            className={clsx(
              'hw-size-7 hw-rounded-lg hw-text-center hw-text-sm/7 hw-font-medium dark:hw-text-white',
              'data-[hover]:hw-bg-gray-100 dark:data-[hover]:hw-bg-gray-900',
              'data-[active]:hw-shadow data-[active]:hw-ring-1 data-[active]:hw-ring-black/10 dark:data-[active]:hw-ring-white/80',
              'data-[active]:data-[hover]:hw-bg-gray-50',
            )}
          >
            {i + 1}
          </Link>
        ))}
      </div>
      <Button variant='outline' href={nextPageUrl} disabled={!nextPageUrl}>
        Next
        <ChevronRightIcon className='hw-size-4' />
      </Button>
    </div>
  )
}

export default async function Blog({
  searchParams: unawaitedParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const searchParams = await unawaitedParams
  const page =
    'page' in searchParams
      ? typeof searchParams.page === 'string' && parseInt(searchParams.page) > 1
        ? parseInt(searchParams.page)
        : notFound()
      : 1

  const category =
    typeof searchParams.category === 'string'
      ? searchParams.category
      : undefined

  return (
    <main className='hw-overflow-hidden'>
      <GradientBackground />
      <Container>
        <Subheading className='hw-mt-32 hw-animate-fade-in hw-opacity-0'>
          Blog
        </Subheading>
        <Heading
          as='h1'
          className='hw-mt-2 hw-animate-fade-in hw-opacity-0 [--animation-delay:200ms]'
        >
          What’s happening at Harmony.
        </Heading>
        <Lead className='hw-mt-6 hw-max-w-3xl hw-animate-fade-in hw-opacity-0 [--animation-delay:400ms]'>
          Stay informed with product updates, company news, and insights on how
          to sell smarter at your company.
        </Lead>
      </Container>
      {page === 1 && !category && <FeaturedPosts />}
      <Container className='hw-mt-16 hw-pb-24 hw-animate-fade-in hw-opacity-0 [--animation-delay:600ms]'>
        <Categories selected={category} />
        <Posts page={page} category={category} />
        <Pagination page={page} category={category} />
      </Container>
    </main>
  )
}

import { ChevronLeftIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'
import type { Metadata } from 'next'
import { PortableText } from 'next-sanity'
import { notFound } from 'next/navigation'
import { image } from '../../../../sanity/image'
import { getPost } from '../../../../sanity/queries'
import { Button } from '@/components/button'
import { Container } from '@/components/container'
import { Footer } from '@/components/footer'
import { GradientBackground } from '@/components/gradient'
import { Link } from '@/components/link'
import { Heading, Subheading } from '@/components/text'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPost(params.slug)

  return post ? { title: post.title, description: post.excerpt } : {}
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string }
}) {
  const post = (await getPost(params.slug)) || notFound()

  return (
    <main className='hw-overflow-hidden'>
      <GradientBackground />
      <Container>
        <Subheading className='hw-mt-32'>
          {dayjs(post.publishedAt).format('dddd, MMMM D, YYYY')}
        </Subheading>
        <Heading as='h1' className='hw-mt-2'>
          {post.title}
        </Heading>
        <div className='hw-mt-16 hw-grid hw-grid-cols-1 hw-gap-8 hw-pb-24 lg:hw-grid-cols-[15rem_1fr] xl:hw-grid-cols-[15rem_1fr_15rem]'>
          <div className='hw-flex hw-flex-wrap hw-items-center hw-gap-8 max-lg:hw-justify-between lg:hw-flex-col lg:hw-items-start'>
            {post.author && (
              <div className='hw-flex hw-items-center hw-gap-3'>
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
            {Array.isArray(post.categories) && (
              <div className='hw-flex hw-flex-wrap hw-gap-2'>
                {post.categories.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/blog?category=${category.slug}`}
                    className='hw-rounded-full hw-border hw-border-dotted hw-border-gray-300 hw-bg-gray-50 hw-px-2 hw-text-sm/6 hw-font-medium hw-text-gray-500'
                  >
                    {category.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className='hw-text-gray-700'>
            <div className='hw-max-w-2xl xl:hw-mx-auto'>
              {post.mainImage && (
                <img
                  alt={post.mainImage.alt || ''}
                  src={image(post.mainImage).size(2016, 1344).url()}
                  className='hw-mb-10 hw-aspect-[3/2] hw-w-full hw-rounded-2xl hw-object-cover hw-shadow-xl'
                />
              )}
              {post.body && (
                <PortableText
                  value={post.body}
                  components={{
                    block: {
                      normal: ({ children }) => (
                        <p className='hw-my-10 hw-text-base/8 first:hw-mt-0 last:hw-mb-0 dark:hw-text-white'>
                          {children}
                        </p>
                      ),
                      h2: ({ children }) => (
                        <h2 className='hw-mb-10 hw-mt-12 hw-text-2xl/8 hw-font-medium hw-tracking-tight hw-text-gray-950 dark:hw-text-white first:hw-mt-0 last:hw-mb-0'>
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className='hw-mb-10 hw-mt-12 hw-text-xl/8 hw-font-medium hw-tracking-tight hw-text-gray-950 dark:hw-text-white first:hw-mt-0 last:hw-mb-0'>
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className='hw-my-10 hw-border-l-2 hw-border-l-gray-300 hw-pl-6 hw-text-base/8 hw-text-gray-950 dark:hw-text-white first:hw-mt-0 last:hw-mb-0'>
                          {children}
                        </blockquote>
                      ),
                    },
                    types: {
                      image: ({ value }: { value: { alt: string } }) => (
                        <img
                          alt={value.alt || ''}
                          src={image(value).width(2000).url()}
                          className='hw-w-full hw-rounded-2xl'
                        />
                      ),
                      separator: ({ value }: { value: { style: string } }) => {
                        switch (value.style) {
                          case 'line':
                            return (
                              <hr className='hw-my-8 hw-border-t hw-border-gray-200' />
                            )
                          case 'space':
                            return <div className='hw-my-8' />
                          default:
                            return null
                        }
                      },
                    },
                    list: {
                      bullet: ({ children }) => (
                        <ul className='hw-list-disc hw-pl-4 hw-text-base/8 marker:hw-text-gray-400 dark:marker:hw-text-gray-200'>
                          {children}
                        </ul>
                      ),
                      number: ({ children }) => (
                        <ol className='hw-list-decimal hw-pl-4 hw-text-base/8 marker:hw-text-gray-400 dark:marker:hw-text-gray-200'>
                          {children}
                        </ol>
                      ),
                    },
                    listItem: {
                      bullet: ({ children }) => {
                        return (
                          <li className='hw-my-2 hw-pl-2 has-[br]:hw-mb-8 dark:hw-text-white'>
                            {children}
                          </li>
                        )
                      },
                      number: ({ children }) => {
                        return (
                          <li className='hw-my-2 hw-pl-2 has-[br]:hw-mb-8 dark:hw-text-white'>
                            {children}
                          </li>
                        )
                      },
                    },
                    marks: {
                      strong: ({ children }) => (
                        <strong className='hw-font-semibold hw-text-gray-950 dark:hw-text-white'>
                          {children}
                        </strong>
                      ),
                      code: ({ children }) => (
                        <>
                          <span aria-hidden>`</span>
                          <code className='hw-text-[15px]/8 hw-font-semibold hw-text-gray-950 dark:hw-text-white'>
                            {children}
                          </code>
                          <span aria-hidden>`</span>
                        </>
                      ),
                      link: ({
                        value,
                        children,
                      }: {
                        value?: { href: string }
                        children: React.ReactNode
                      }) => {
                        return (
                          <Link
                            href={value?.href ?? ''}
                            className='hw-font-medium hw-text-gray-950 hw-underline hw-decoration-gray-400 hw-underline-offset-4 data-[hover]:hw-decoration-gray-600 dark:hw-text-white'
                          >
                            {children}
                          </Link>
                        )
                      },
                    },
                  }}
                />
              )}
              <div className='hw-mt-10'>
                <Button variant='outline' href='/blog'>
                  <ChevronLeftIcon className='hw-size-4' />
                  Back to blog
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </main>
  )
}

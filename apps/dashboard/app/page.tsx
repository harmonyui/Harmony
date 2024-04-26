import {  withAuth } from "../../../utils/protected-routes-hoc";
import { redirect } from "next/navigation";

const Home = withAuth(() => {
	redirect('/projects');
})

export default Home;

interface LinkCardProps {
  href: string;
  title: string;
  description: string;
}

const LinkCard: React.FC<LinkCardProps> = ({ href, title, description }) => (
  <a
    href={href}
    className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
    target="_blank"
    rel="noopener noreferrer"
  >
    <h2 className="mb-3 text-2xl font-semibold">
      {title}{' '}
      <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
        -&gt;
      </span>
    </h2>
    <p className="m-0 max-w-[30ch] text-sm opacity-50">{description}</p>
  </a>
);

const LinkSection: React.FC = () => (
  <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
    <LinkCard
      href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
      title="Docs"
      description="Find in-depth information about Next.js features and API."
    />

    <LinkCard
      href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
      title="Learn"
      description="Learn about Next.js in an interactive course with quizzes!"
    />

    <LinkCard
      href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
      title="Templates"
      description="Explore starter templates for Next.js."
    />

    <LinkCard
      href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
      title="Deploy"
      description="Instantly deploy your Next.js site to a shareable URL with Vercel."
    />
  </div>
);
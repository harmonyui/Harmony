import { redirect } from "next/navigation";

export default async function Home() {
  return (
		<div className="hero-content">
			<HeroHeading heading="Investment fund infrastructure, {built for anyone}"/>
			<div className="block-40h"></div>
			<div className="hero-desc">Thousands of investors and managers, from multi-billion dollar hedge funds to fresh syndicate leads, use Canopy’s software to set up funds, manage capital, and report performances online.</div>
			<a id="popup-open" href="/request-demo" className="btn is--request w-inline-block">
				<div className="text-14">Request Demo</div>
			</a>
			<div className="logos-row marg-top-80 hide-mobile">
				<div className="text-15">Invest alongside top funds</div>
				<div className="h-logos-div marg-top-15">
					<img src="https://uploads-ssl.webflow.com/61c1c0b4e368108c5ab02f30/61c36b514f434b488b62b9a6_h-logo-1.svg" loading="lazy" width="160" height="40" alt="" className="h-logo-img"/>
					<img src="https://uploads-ssl.webflow.com/61c1c0b4e368108c5ab02f30/61c36b5166241f19cd2345ae_h-logo-2.svg" loading="lazy" width="160" height="40" alt="" className="h-logo-img"/>
					<img src="https://uploads-ssl.webflow.com/61c1c0b4e368108c5ab02f30/61c36b514f434bd96f62b9a7_h-logo-3.svg" loading="lazy" width="160" height="40" alt="" className="h-logo-img"/>
				</div>
			</div>
		</div>
  )
}

interface HeroHeadingProps {
	heading: string
}
const HeroHeading: React.FunctionComponent<HeroHeadingProps> = ({heading}) => {
	const match = /(.*)\{(.*)}/.exec(heading);
	const [_, h1, h2] = match ?? ['', 'Test', 'Heading'];
	return <h1 className="hero-heading">{h1}<br/><span className="span-hero-h">{h2}</span></h1>
}

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
import { getClass } from "../../../../util/src/index";
import React from "react";

export type IconComponent = (
  props: React.ComponentPropsWithoutRef<"svg">,
) => JSX.Element;
export const DeleteIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      className={`${className || ""} fill-primary stroke-primary-light`}
      {...props}
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="10" strokeWidth="2" width="10" x="5" y="6" />
      <path d="M3 6H17" strokeWidth="2" />
      <path d="M8 6V4H12V6" strokeWidth="2" />
    </svg>
  );
};

export const ClipboardIcon: IconComponent = (props) => {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
    </svg>
  )
}

export const Bars3BottomLeft: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
		</svg>
	)
}

export const Bars3BottomRight: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25" />
		</svg>
	)
}

export const Bars3CenterLeft: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12H12m-8.25 5.25h16.5" />
		</svg>
	)
}

export const Bars3: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
		</svg>
	)
}

export const Bars4Icon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
    </svg>

	)
}

export const AddIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ""} fill-primary stroke-primary-light`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 6v12m6-6H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const BarsArrowDownIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const CursorArrowRaysIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59" />
		</svg>
	)
}

export const EyeDropperIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M15 11.25l1.5 1.5.75-.75V8.758l2.276-.61a3 3 0 10-3.675-3.675l-.61 2.277H12l-.75.75 1.5 1.5M15 11.25l-8.47 8.47c-.34.34-.8.53-1.28.53s-.94.19-1.28.53l-.97.97-.75-.75.97-.97c.34-.34.53-.8.53-1.28s.19-.94.53-1.28L12.75 9M15 11.25L12.75 9" />
		</svg>

	)
}

export const EditIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ""} fill-primary stroke-primary-light`}
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M4 13V16H7L16 7L13 4L4 13Z" strokeWidth="2" />
    </svg>
  );
};

export const EditSquareIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ArchiveIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ""} fill-primary stroke-primary-light`}
      fill="none"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect height="8" strokeWidth="2" width="10" x="5" y="8" />
      <rect height="4" strokeWidth="2" width="12" x="4" y="4" />
      <path d="M8 12H12" stroke="#A78BFA" strokeWidth="2" />
    </svg>
  );
};
export const AdjustIcon: IconComponent = ({ className, ...props }) => {
  return (
    <svg
      {...props}
      className={`${className || ""} fill-primary stroke-primary-light`}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
    </svg>
  );
};

export const CheckIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 12.75l6 6 9-13.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronDownIcon: IconComponent = (props) => {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M19.5 8.25l-7.5 7.5-7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
  );
};

export const ChevronUpIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.5 15.75l7.5-7.5 7.5 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChatBubbleLeftEllipsisIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const TagIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M6 6h.008v.008H6V6z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const PlusSmallIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 6v12m6-6H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const PlusIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 4.5v15m7.5-7.5h-15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MinusIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19.5 12h-15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const DashboardIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 22 21"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
      <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
    </svg>
  );
};

export const TilesIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z" />
    </svg>
  );
};

export const MailboxIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m17.418 3.623-.018-.008a6.713 6.713 0 0 0-2.4-.569V2h1a1 1 0 1 0 0-2h-2a1 1 0 0 0-1 1v2H9.89A6.977 6.977 0 0 1 12 8v5h-2V8A5 5 0 1 0 0 8v6a1 1 0 0 0 1 1h8v4a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-4h6a1 1 0 0 0 1-1V8a5 5 0 0 0-2.582-4.377ZM6 12H4a1 1 0 0 1 0-2h2a1 1 0 0 1 0 2Z" />
    </svg>
  );
};

export const UserIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 14 18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M7 9a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm2 1H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5Z" />
    </svg>
  );
};

export const UserGroupIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
		</svg>
	)
}

export const UsersIcon: IconComponent = (props) => {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
  );
};

export const UsersGroupIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 20 19"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.5 0A3.987 3.987 0 0 0 11 2.1a4.977 4.977 0 0 1 3.9 5.858A3.989 3.989 0 0 0 14.5 0ZM9 13h2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z" />
      <path d="M5 19h10v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2ZM5 7a5.008 5.008 0 0 1 4-4.9 3.988 3.988 0 1 0-3.9 5.859A4.974 4.974 0 0 1 5 7Zm5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1h-.424a5.016 5.016 0 0 1-1.942 2.232A6.007 6.007 0 0 1 17 17h2a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5ZM5.424 9H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h2a6.007 6.007 0 0 1 4.366-5.768A5.016 5.016 0 0 1 5.424 9Z" />
    </svg>
  );
};

export const UserCircleIcon: IconComponent = (props) => {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
  );
};

export const ArrowDownIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const ArrowUpIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const ArrowRightIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
		</svg>

	)
}

export const ArrowLeftIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="hw-w-6 hw-h-6">
			<path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
		</svg>
	)
}

export const BagIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 18 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z" />
    </svg>
  );
};

export const Cog6ToothIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
			<path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
			<path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
		</svg>
	)
}

export const GitBranchIcon: IconComponent = (props) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="10 8 33 33" data-name="Layer 1" id="git-branch">
			<path d="M37.1 15.14a3.39 3.39 0 1 0-4.32 3.23c-.33 5.11-6.63 5.53-8.6 5.53a10.42 10.42 0 0 0-8.7 4.81V15.85a3.39 3.39 0 1 0-1.65 0v16a.41.41 0 0 1 0 .09v1.83a3.39 3.39 0 1 0 1.65 0v-1.31c.09-.28 2.29-6.76 8.66-6.76 4.92 0 10.15-1.94 10.41-7.32a3.39 3.39 0 0 0 2.55-3.24Zm-24.17-2.56a1.73 1.73 0 1 1 1.73 1.73 1.72 1.72 0 0 1-1.73-1.73ZM16.38 37a1.73 1.73 0 1 1-1.72-1.72A1.73 1.73 0 0 1 16.38 37Zm17.33-20.14a1.73 1.73 0 1 1 1.73-1.72 1.72 1.72 0 0 1-1.73 1.72Z"></path>
		</svg>

	)
}

export const GitPullRequestIcon: IconComponent = (props) => {
	return (
		<svg {...props} viewBox="0 0 35 38" fill="none" xmlns="http://www.w3.org/2000/svg">
			<mask id="mask0_12_795" style={{maskType: 'luminance'}} maskUnits="userSpaceOnUse" x="1" y="1" width="32" height="35">
			<path d="M1.8407 1.01827H32.6358V35.0058H1.8407V1.01827Z" fill="white"/>
			</mask>
			<g mask="url(#mask0_12_795)">
			<path d="M7.44998 1.01827C4.3737 1.01827 1.84998 3.57111 1.84998 6.68286C1.84998 9.3029 3.64778 11.5058 6.04998 12.1426V23.8811C3.64778 24.5183 1.84998 26.7208 1.84998 29.3412C1.84998 32.453 4.3737 35.0058 7.44998 35.0058C10.5262 35.0058 13.05 32.453 13.05 29.3412C13.05 26.7208 11.2522 24.5183 8.84998 23.8811V12.1426C11.2522 11.5058 13.05 9.3029 13.05 6.68286C13.05 3.57111 10.5262 1.01827 7.44998 1.01827ZM21.45 1.01827L14.45 6.68286L21.45 12.3475V8.09901H24.25C25.0411 8.09901 25.65 8.71489 25.65 9.51516V23.6767C25.65 23.7434 25.6544 23.8098 25.6637 23.8758C23.2543 24.5077 21.45 26.7155 21.45 29.3412C21.45 32.453 23.9737 35.0058 27.05 35.0058C30.1262 35.0058 32.65 32.453 32.65 29.3412C32.65 26.7155 30.8457 24.5077 28.4362 23.8758C28.4455 23.8098 28.45 23.7434 28.45 23.6767V9.51516C28.45 7.18565 26.5529 5.26671 24.25 5.26671H21.45V1.01827ZM7.44998 3.85057C9.01282 3.85057 10.25 5.10158 10.25 6.68286C10.25 8.21989 9.07723 9.43444 7.57555 9.50123C7.52654 9.49672 7.47752 9.49508 7.4281 9.4959C7.39245 9.49631 7.3568 9.49795 7.32156 9.50123C5.8211 9.43321 4.64998 8.21907 4.64998 6.68286C4.64998 5.10158 5.88713 3.85057 7.44998 3.85057ZM27.05 26.509C28.6128 26.509 29.85 27.76 29.85 29.3412C29.85 30.9221 28.6128 32.1735 27.05 32.1735C25.4871 32.1735 24.25 30.9221 24.25 29.3412C24.25 27.76 25.4871 26.509 27.05 26.509ZM7.32399 26.5229C7.40906 26.5307 7.49373 26.5307 7.57839 26.5229C9.07885 26.5909 10.25 27.8046 10.25 29.3412C10.25 30.9221 9.01282 32.1735 7.44998 32.1735C5.88713 32.1735 4.64998 30.9221 4.64998 29.3412C4.64998 27.8038 5.82272 26.5893 7.32399 26.5229Z" fill="#11283B"/>
			</g>
		</svg>
	)
}

export const SigninIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 18 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1 8h11m0 0L8 4m4 4-4 4m4-11h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export const EditDocumentIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
      <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
      <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
    </svg>
  );
};

export const DocumentDuplicateIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const MapPinIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const HamburgerIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const ChartPieIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const AttachmentIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  );
};

export const EllipsisHorizontalIcon: IconComponent = (props) => {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
  );
};

export const ClockIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const Bars3Icon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const PaperClipIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const FaceFrownIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const FaceSmileIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const FireIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const HandThumbUpIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const HeartIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const CheckCircleSolidIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" fillRule="evenodd" />
		</svg>
	)
}

export const RightArrowIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        clipRule="evenodd"
        d="M20 10C20 4.48 15.52 0 10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10ZM6 9H10V6L14 10L10 14V11H6V9Z"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const CalendarIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronLeftIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15.75 19.5L8.25 12l7.5-7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ChevronRightIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const ExclamationIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const CheckmarkIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.346 3.301a.929.929 0 0 1 1.37 0 1.076 1.076 0 0 1 0 1.456l-4.64 4.94a.929.929 0 0 1-1.37 0L3.284 7.123a1.076 1.076 0 0 1 0-1.456.929.929 0 0 1 1.37 0L6.39 7.513l3.955-4.212z" />
    </svg>
  );
};

export const CheckmarkSolidIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path clipRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" fillRule="evenodd" />
		</svg>
	)
}

export const XMarkIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 18L18 6M6 6l12 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const FilterIcon: IconComponent = (props) => {
  return (
    <svg {...props} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.994.004c.555 0 1.006.448 1.006 1a.997.997 0 0 1-.212.614l-5.782 7.39L9 13.726a1 1 0 0 1-.293.708L7.171 15.97A.1.1 0 0 1 7 15.9V9.008l-5.788-7.39A.996.996 0 0 1 1.389.214a1.01 1.01 0 0 1 .617-.21z"
        fillRule="evenodd"
      />
    </svg>
  );
};

export const PhotoIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const HomeIcon: IconComponent = (props) => {
	return (
		<svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	)
}

export const DocumentTextIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const FolderIcon: IconComponent = (props) => {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
  );
};

export const UploadIcon: IconComponent = (props) => {
  return (
    <svg
      {...props}
      fill="none"
      viewBox="0 0 20 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export const ToggleIcon: React.FunctionComponent<{icon: IconComponent, selected: boolean}> = ({icon: Icon, selected}) => {
	return (
		<Icon
			aria-hidden="true"
			className={getClass(
				selected ? 'hw-text-primary' : 'hw-text-gray-400 group-hover:text-primary',
				'hw-h-6 hw-w-6 hw-shrink-0'
			)}
		/>
	)
}

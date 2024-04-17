import { Button } from "./button"

interface ContactBoxProps {
    website: string;
    email: string;
    phone: string;
}
export const ContactBox: React.FunctionComponent<ContactBoxProps> = ({website, email, phone}) => {
    return (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-md border p-2">
            <Button className="bg-[#645af6]">Contact Venue</Button>
            <Button className="bg-white">
                {email}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="ml-2 h-4 w-4">
                    <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path><path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
                </svg>
            </Button>
            <div className="flex w-full items-center">
                <Button as="a" className="bg-white" href={website}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="mr-2 h-4 w-4">
                        <path d="M7 9a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"></path><path d="M5.75 15a8.015 8.015 0 1 0 9.25 -13"></path><path d="M11 17v4"></path><path d="M7 21h8"></path>
                    </svg>
                    Visit Website
                </Button>
                <Button className="ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="mr-2 h-4 w-4">
                        <path d="M5 4h4l2 5l-2.5 1.5a11 11 0 0 0 5 5l1.5 -2.5l5 2v4a2 2 0 0 1 -2 2a16 16 0 0 1 -15 -15a2 2 0 0 1 2 -2"></path>
                    </svg>
                    {phone}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="ml-2 h-4 w-4">
                        <path d="M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2"></path>
                        <path d="M9 3m0 2a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v0a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2z"></path>
                    </svg>
                </Button>
            </div>
        </div>
    )
}
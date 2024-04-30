interface VenuePhotosProps {
    mainImage: string;
    images: string[]
}

export const VenuePhotos: React.FunctionComponent<VenuePhotosProps> = ({mainImage, images}) => {
    return (
        <div className="relative  hidden space-x-1 md:flex xl:mx-0">
            <div className="relative aspect-square w-1/2 overflow-hidden rounded-l-lg rounded-r-none">
                <img alt="Main Image" src={mainImage}/>
            </div>
            <div className="relative grid aspect-square w-1/2 grid-cols-2 grid-rows-2 overflow-hidden rounded-r-xl">
                {images.map(image => <div className="relative h-full w-full bg-black" key={image}>
                    <img alt="Image" className="bg-gray-100 object-cover" src={image}/>
                </div>)}
            </div>
            <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 absolute bottom-4 right-4 bg-white text-black hover:bg-violet-500 hover:text-white hover:opacity-100" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="radix-:R6iltbrrquuta:" data-state="closed">
                Show All
            </button>
        </div>
    )
}
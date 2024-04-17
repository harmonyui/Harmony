interface Address {
    addressLine: string;
    city: string;
    state: string;
    zipCode: number;
}

interface VenueItem {
    address: Address;
    capacity: number;
    size: number;
    priceRange: number;
}

interface VenueSubTextProps {
    venue: VenueItem
}
export const VenueSubText: React.FunctionComponent<VenueSubTextProps> = ({venue}) => {
    const {address, capacity, size, priceRange} = venue;
    const {addressLine, city, state, zipCode} = address;
    return (
        <div className="flex items-center justify-between font-semibold md:text-lg">
            <div className="hidden items-center space-x-3 md:flex">
                <div className="flex">
                    <p>{addressLine}</p>
                    <p>, {city}</p>
                    <p>, {state}</p>
                    <p>, {zipCode}</p>
                </div>
                <p className="hidden md:block">•</p>
                <p>Holds {capacity} •</p>
                <p>{size} sq. feet</p>
            </div>
            <div className="flex items-center space-x-2 text-center md:text-right">
                <p className="font-semibold">{priceRange}</p>
                <p className="font-light"> / event</p>
            </div>
        </div>
    )
}
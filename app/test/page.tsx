const TestPage = () => {
    return (
        <TestParent/>
    )
}

const TestParent = () => {
    return (
        <div className="hw-h-full hw-w-full">
            <div className="hw-flex hw-items-center hw-justify-center hw-p-20 hw-bg-gray-300">
                <span>Hello world</span>
            </div>
            <div className="hw-flex hw-items-center hw-justify-center hw-p-20 hw-bg-gray-500">
                <span>Thank you</span>
            </div>
        </div>
    )
}

export default TestPage;
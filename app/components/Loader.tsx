export default function Loader() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[50vh]">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-neutral-200 dark:border-neutral-800 rounded-full"></div>
                <div 
                    className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-transparent animate-spin"
                    style={{
                        borderTopColor: 'rgba(74, 222, 128, 0.7)',
                        borderRightColor: 'rgba(250, 204, 21, 0.7)',
                        borderBottomColor: 'rgba(163, 230, 53, 0.7)',
                        borderLeftColor: 'rgba(74, 222, 128, 0.7)',
                    }}
                ></div>
            </div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">Loading videos...</p>
        </div>
    );
}

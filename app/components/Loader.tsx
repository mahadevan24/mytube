export default function Loader() {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full min-h-[50vh]">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-neutral-200 dark:border-neutral-800 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div>
            </div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">Loading videos...</p>
        </div>
    );
}

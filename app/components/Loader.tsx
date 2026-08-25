interface LoaderProps {
    compact?: boolean;
    label?: string;
}

export default function Loader({ compact = false, label = 'Loading videos...' }: LoaderProps) {
    return (
        <div
            className={`flex w-full flex-col items-center justify-center ${compact ? 'py-8' : 'min-h-[50vh]'}`}
            role="status"
            aria-live="polite"
        >
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
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium animate-pulse">{label}</p>
        </div>
    );
}

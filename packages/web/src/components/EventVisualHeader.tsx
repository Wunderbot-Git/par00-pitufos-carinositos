'use client';

import Image from 'next/image';

interface EventVisualHeaderProps {
    // In the future, these would come from props/DB.
    // For now we use the static assets we just saved.
}

export function EventVisualHeader() {
    return (
        <div className="relative w-full">
            {/* Background Image Container */}
            <div className="relative w-full h-[140px] bg-gray-200 overflow-hidden">
                <Image
                    src="/assets/event-header.jpg"
                    alt="Event Header"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Subtle gradient overlay to make the transition and logo pop */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-gray-900/20 to-transparent"></div>
            </div>

            {/* Overlapping Logo Container */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20">
                <div className="relative w-[110px] h-[110px] bg-white rounded-full border-[5px] border-white shadow-[0_8px_24px_rgba(0,0,0,0.15)] overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full p-2.5">
                        <Image
                            src="/assets/event-logo.png"
                            alt="Event Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

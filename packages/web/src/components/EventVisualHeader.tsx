'use client';

import Image from 'next/image';
import { THEME } from '@/lib/theme';

export function EventVisualHeader() {
    return (
        <div className="relative w-full aspect-[1/1] overflow-hidden -mt-4 z-0 rounded-b-[32px] thick-border border-t-0 border-l-0 border-r-0 mb-4 shadow-md bg-[#0a4030]">
            <Image
                src={THEME.assets.heroHeader}
                alt={`${THEME.appName} - ${THEME.edition}`}
                fill
                className="object-cover object-top"
                priority
            />
        </div>
    );
}

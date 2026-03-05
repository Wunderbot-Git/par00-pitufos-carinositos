'use client';

import { ReactNode } from 'react';

interface ProjectedStickyHeaderProps {
    projectedRed: number;
    projectedBlue: number;
    isExpanded?: boolean;
    onToggle?: () => void;
    detailContent?: ReactNode;
    detachedTop?: boolean;
}

export function ProjectedStickyHeader({
    projectedRed,
    projectedBlue,
    isExpanded,
    onToggle,
    detailContent,
    detachedTop = false,
}: ProjectedStickyHeaderProps) {
    return (
        <div className={`bg-ryder-bg px-2 pb-2 ${detachedTop ? 'pt-0' : 'pt-2'} transition-all duration-300`}>
            <div className={`bg-white shadow-sm overflow-hidden ${detachedTop ? 'rounded-b-xl rounded-t-none' : 'rounded-xl'} mb-0`}>

                {/* PROJECTED SECTION (Clickable) */}
                <div
                    onClick={onToggle}
                    className="cursor-pointer transition-colors pb-3 hover:bg-gray-50 pt-2"
                >
                    <div className="flex items-center justify-center gap-2 py-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">PROJECTED</span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>

                    <div className="flex justify-center items-center gap-8">
                        {/* Red Proj */}
                        <div className="text-3xl font-bold text-team-red opacity-60">
                            {projectedRed.toFixed(1).replace('.0', '')}
                        </div>

                        {/* VS Small */}
                        <div className="text-sm font-bold text-gray-300 italic">VS</div>

                        {/* Blue Proj */}
                        <div className="text-3xl font-bold text-team-blue opacity-60">
                            {projectedBlue.toFixed(1).replace('.0', '')}
                        </div>
                    </div>
                </div>

                {/* EXPANDED CONTENT: PROJECTED */}
                {isExpanded && detailContent && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
                        {detailContent}
                    </div>
                )}
            </div>
        </div>
    );
}

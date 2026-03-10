'use client';

import { useState } from 'react';

interface TeamScoreHeaderProps {
    redScore: number;
    blueScore: number;
    projectedRed: number;
    projectedBlue: number;
    isCurrentExpanded?: boolean;
    onToggleCurrent?: () => void;
    currentDetailContent?: React.ReactNode;
    isProjectedExpanded?: boolean;
    onToggleProjected?: () => void;
    projectedDetailContent?: React.ReactNode;
    showProjected?: boolean;
    minimized?: boolean;
    detachedBottom?: boolean;
}

export function TeamScoreHeader({
    redScore,
    blueScore,
    projectedRed,
    projectedBlue,
    isCurrentExpanded,
    onToggleCurrent,
    currentDetailContent,
    isProjectedExpanded,
    onToggleProjected,
    projectedDetailContent,
    showProjected = true,
    minimized = false,
    detachedBottom = false,
}: TeamScoreHeaderProps) {
    if (minimized) {
        // Compact Minimized View - Projected Only
        return (
            <div className="bg-ryder-bg pt-2 px-2 pb-2 transition-all duration-300">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-0 py-2 px-6 flex items-center justify-between h-[50px]">
                    {/* RED PROJECTED */}
                    <div className="text-2xl font-black text-team-red opacity-80">
                        {projectedRed.toFixed(1).replace('.0', '')}
                    </div>

                    {/* CENTER LABEL */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">PROYECTADO</span>
                    </div>

                    {/* BLUE PROJECTED */}
                    <div className="text-2xl font-black text-team-blue opacity-80">
                        {projectedBlue.toFixed(1).replace('.0', '')}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-ryder-bg pt-2 px-2 ${detachedBottom ? 'pb-0' : 'pb-2'}`}>
            <div className={`bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] overflow-hidden ${detachedBottom ? 'rounded-t-2xl rounded-b-none mb-0 border-b border-gray-100/50' : 'rounded-2xl mb-2'}`}>

                {/* CURRENT SCORE SECTION (Clickable) */}
                <div
                    onClick={onToggleCurrent}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                    {/* CURRENT SCORE HEADER */}
                    <div className="flex items-center justify-center gap-2 pt-3 pb-1">
                        <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">MARCADOR ACTUAL</span>
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
                            className={`text-gray-300 transition-transform duration-200 ${isCurrentExpanded ? 'rotate-180' : ''}`}
                        >
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>

                    {/* Score Row */}
                    <div className="flex items-stretch h-[65px]">
                        {/* RED TEAM */}
                        <div className="flex-1 flex flex-col items-center justify-center border-r border-gray-50 relative bg-transparent">
                            <div className="text-[10px] font-bold text-team-red tracking-widest uppercase mb-1">CARIÑOSITOS</div>
                            <div className="text-4xl font-black tracking-tighter text-team-red leading-none">
                                {redScore}
                            </div>
                        </div>

                        {/* VS */}
                        <div className="w-[40px] flex flex-col items-center justify-center text-gray-300 shrink-0">
                            <div className="text-xl font-black italic opacity-50">VS</div>
                        </div>

                        {/* BLUE TEAM */}
                        <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-50 relative bg-transparent">
                            <div className="text-[10px] font-bold text-team-blue tracking-widest uppercase mb-1">PITUFOS</div>
                            <div className="text-4xl font-black tracking-tighter text-team-blue leading-none">
                                {blueScore}
                            </div>
                        </div>
                    </div>
                </div>

                {/* EXPANDED CONTENT: CURRENT */}
                {isCurrentExpanded && currentDetailContent && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
                        {currentDetailContent}
                    </div>
                )}

                {/* DASHED DIVIDER */}
                {showProjected && (
                    <>
                        <div className="px-6 py-1">
                            <div className="border-t-2 border-dashed border-gray-100 w-full"></div>
                        </div>

                        {/* PROJECTED SECTION (Clickable) */}
                        <div
                            onClick={onToggleProjected}
                            className="cursor-pointer transition-colors pb-3 hover:bg-gray-50"
                        >
                            <div className="flex items-center justify-center gap-2 py-1">
                                <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase">PROYECTADO</span>
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
                                    className={`text-gray-300 transition-transform duration-200 ${isProjectedExpanded ? 'rotate-180' : ''}`}
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
                        {isProjectedExpanded && projectedDetailContent && (
                            <div className="border-t border-gray-100 bg-gray-50/30">
                                {projectedDetailContent}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

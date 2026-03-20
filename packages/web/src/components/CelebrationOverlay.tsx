'use client';

import { useRef, useEffect } from 'react';

const CELEBRATION_VIDEOS: Record<string, string> = {
    red: 'https://cdn.dam.alkosto.com/Yalo/video_test/hf_20260320_204905_a6734336-3445-45ef-9dc4-234c50c081a6.mp4',
    blue: 'https://cdn.dam.alkosto.com/Yalo/video_test/hf_20260320_203937_ae35d497-7aee-479a-8a5b-389e10336935.mp4',
    blue_tournament: 'https://cdn.dam.alkosto.com/Yalo/video_test/hf_20260320_213502_d9ac42d0-01d8-4560-a26a-3bd7497c661c%20(1).mp4',
};

interface CelebrationOverlayProps {
    team: 'red' | 'blue';
    variant?: 'hole' | 'tournament';
    onClose: () => void;
}

export function CelebrationOverlay({ team, variant = 'hole', onClose }: CelebrationOverlayProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        // Try to auto-play (may require user interaction on some browsers)
        videoRef.current?.play().catch(() => {
            // If autoplay blocked, dismiss after short delay
            setTimeout(onClose, 1000);
        });
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
            onClick={onClose}
        >
            <video
                ref={videoRef}
                src={CELEBRATION_VIDEOS[variant === 'tournament' ? `${team}_tournament` : team] || CELEBRATION_VIDEOS[team]}
                className="max-w-[90vw] max-h-[70vh] rounded-2xl shadow-2xl"
                playsInline
                muted
                onEnded={onClose}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

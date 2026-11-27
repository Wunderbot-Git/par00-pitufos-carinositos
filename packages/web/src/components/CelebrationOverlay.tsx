'use client';

import { useRef, useEffect } from 'react';
import { THEME } from '@/lib/theme';

const CELEBRATION_VIDEOS = THEME.assets.videos;

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
                onError={onClose}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

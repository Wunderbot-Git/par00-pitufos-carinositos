'use client';

import { useRef, useEffect } from 'react';

interface CelebrationOverlayProps {
    onClose: () => void;
}

export function CelebrationOverlay({ onClose }: CelebrationOverlayProps) {
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
                src="/videos/celebration.mp4"
                className="max-w-[90vw] max-h-[70vh] rounded-2xl shadow-2xl"
                playsInline
                muted
                onEnded={onClose}
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}

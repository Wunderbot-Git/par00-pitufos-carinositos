import Image from 'next/image';
import { THEME } from '@/lib/theme';

export const BattleHeader = () => {
    return (
        <div className="relative w-full overflow-visible">
            <div className="relative w-full pt-4 pb-4 z-10">
                {/* Complete Title Graphic (Logo + Characters) */}
                <div className="relative w-full aspect-[800/264]">
                    <Image
                        src={THEME.assets.battleHeader}
                        alt={THEME.edition}
                        fill
                        className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]"
                        unoptimized
                    />
                </div>
            </div>
        </div>
    );
};


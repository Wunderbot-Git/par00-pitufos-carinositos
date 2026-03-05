'use client';

interface NumericKeypadProps {
    holeNumber: number;
    onNumberPress: (num: number) => void;
    onClose: () => void;
}

export function NumericKeypad({ holeNumber, onNumberPress, onClose }: NumericKeypadProps) {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg max-w-md mx-auto z-50">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b">
                <span className="text-sm font-bold text-gray-700">HOLE {holeNumber}</span>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 px-3 py-1"
                >
                    Close
                </button>
            </div>

            {/* Number buttons */}
            <div className="grid grid-cols-5 gap-2 p-4">
                {numbers.map((num) => (
                    <button
                        key={num}
                        onClick={() => onNumberPress(num)}
                        className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg text-2xl font-bold text-gray-800 active:bg-gray-200 hover:bg-gray-200 transition-colors"
                    >
                        {num}
                    </button>
                ))}
            </div>
        </div>
    );
}

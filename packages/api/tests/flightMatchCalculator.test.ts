import { describe, it, expect } from 'vitest';
import { calculateFlightMatches, FlightMatchesInput } from '../src/scoring';

describe('Flight Match Calculator', () => {

    const si18 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    const makePlayer = (hcp: number, front: number[], back: number[]): any => ({
        handicapIndex: hcp,
        frontNineGross: front,
        backNineGross: back,
        strokeIndexes: si18
    });

    describe('Complete Flight', () => {
        it('should calculate all 4 matches', () => {
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4, 4, 4, 4]),
                redPlayer2: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], [4, 4, 4, 4, 4, 4, 4, 4, 4]),
                bluePlayer1: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5, 5, 5]),
                bluePlayer2: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5, 5, 5])
            };

            const result = calculateFlightMatches(input);

            expect(result.singles1).not.toBeNull();
            expect(result.singles2).not.toBeNull();
            expect(result.fourball).not.toBeNull();
            expect(result.scramble).not.toBeNull();
            expect(result.summary.matches).toHaveLength(4);
        });

        it('should aggregate total points correctly', () => {
            // Red wins all matches decisively
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [3, 3, 3, 3, 3, 4, 4, 4, 4], [3, 3, 3, 3, 3, 4, 4, 4, 4]),
                redPlayer2: makePlayer(10, [3, 3, 3, 3, 3, 4, 4, 4, 4], [3, 3, 3, 3, 3, 4, 4, 4, 4]),
                bluePlayer1: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5, 5, 5]),
                bluePlayer2: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], [5, 5, 5, 5, 5, 5, 5, 5, 5])
            };

            const result = calculateFlightMatches(input);

            // Red should win all: 1 + 1 + 1 + 2 = 5 points
            expect(result.summary.totalRedPoints).toBe(5);
            expect(result.summary.totalBluePoints).toBe(0);
        });
    });

    describe('Partial Data', () => {
        it('should handle missing back 9 (no scramble)', () => {
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], []),
                redPlayer2: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], []),
                bluePlayer1: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], []),
                bluePlayer2: makePlayer(10, [5, 5, 5, 5, 5, 5, 5, 5, 5], [])
            };

            const result = calculateFlightMatches(input);

            expect(result.singles1).not.toBeNull();
            expect(result.singles2).not.toBeNull();
            expect(result.fourball).not.toBeNull();
            expect(result.scramble).toBeNull();
            expect(result.summary.matches).toHaveLength(3);
        });

        it('should handle gracefully missing front 9', () => {
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [], [4, 4, 4, 4, 4, 4, 4, 4, 4]),
                redPlayer2: makePlayer(10, [], [4, 4, 4, 4, 4, 4, 4, 4, 4]),
                bluePlayer1: makePlayer(10, [], [5, 5, 5, 5, 5, 5, 5, 5, 5]),
                bluePlayer2: makePlayer(10, [], [5, 5, 5, 5, 5, 5, 5, 5, 5])
            };

            const result = calculateFlightMatches(input);

            expect(result.singles1).toBeNull();
            expect(result.singles2).toBeNull();
            expect(result.fourball).toBeNull();
            expect(result.scramble).not.toBeNull();
            expect(result.summary.matches).toHaveLength(1);
        });
    });

    describe('Match Types', () => {
        it('should calculate front 9 feeding into singles and fourball', () => {
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], []),
                redPlayer2: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], []),
                bluePlayer1: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], []),
                bluePlayer2: makePlayer(10, [4, 4, 4, 4, 4, 4, 4, 4, 4], [])
            };

            const result = calculateFlightMatches(input);

            // All ties
            expect(result.singles1?.result.finalStatus).toBe('A/S');
            expect(result.singles2?.result.finalStatus).toBe('A/S');
            expect(result.fourball?.result.finalStatus).toBe('A/S');
        });

        it('should calculate scramble worth 2 points', () => {
            const input: FlightMatchesInput = {
                redPlayer1: makePlayer(10, [], [3, 3, 3, 3, 3, 4, 4, 4, 4]),
                redPlayer2: makePlayer(10, [], [3, 3, 3, 3, 3, 4, 4, 4, 4]),
                bluePlayer1: makePlayer(10, [], [5, 5, 5, 5, 5, 5, 5, 5, 5]),
                bluePlayer2: makePlayer(10, [], [5, 5, 5, 5, 5, 5, 5, 5, 5])
            };

            const result = calculateFlightMatches(input);

            expect(result.scramble?.result.redPoints).toBe(2);
            expect(result.scramble?.result.bluePoints).toBe(0);
        });
    });
});

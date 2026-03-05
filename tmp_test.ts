import { calculateFourballMatch, FourballMatchInput } from './packages/api/src/scoring/fourballMatch';

const input: FourballMatchInput = {
    redTeam: {
        player1: { handicapIndex: 12, grossScores: [4, 4, null, null, null, null, null, null, null], strokeIndexes: [3, 1, 9, 11, 5, 13, 15, 7, 17, 4, 2, 10, 12, 6, 14, 16, 8, 18] },
        player2: { handicapIndex: 17, grossScores: [4, 5, null, null, null, null, null, null, null], strokeIndexes: [3, 1, 9, 11, 5, 13, 15, 7, 17, 4, 2, 10, 12, 6, 14, 16, 8, 18] },
    },
    blueTeam: {
        player1: { handicapIndex: 7, grossScores: [4, 5, null, null, null, null, null, null, null], strokeIndexes: [3, 1, 9, 11, 5, 13, 15, 7, 17, 4, 2, 10, 12, 6, 14, 16, 8, 18] },
        player2: { handicapIndex: 17, grossScores: [4, 6, null, null, null, null, null, null, null], strokeIndexes: [3, 1, 9, 11, 5, 13, 15, 7, 17, 4, 2, 10, 12, 6, 14, 16, 8, 18] },
    },
    totalHoles: 9,
    matchPoints: 1
};

const result = calculateFourballMatch(input);
console.log(JSON.stringify(result.finalState, null, 2));
console.log(JSON.stringify(result.result, null, 2));

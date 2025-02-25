export type StatMapping = {
    label: string;
    order: number;
};

export const playerInfoMappings: Record<string, StatMapping> = {
    firstName: { label: 'First Name', order: 1 },
    lastName: { label: 'Last Name', order: 2 },
    primaryNumber: { label: 'Primary Number', order: 3 },
    birthDate: { label: 'Birth Date', order: 4 },
    birthCity: { label: 'Birth City', order: 5 },
    birthStateProvince: { label: 'Birth State/Province', order: 6 },
    birthCountry: { label: 'Birth Country', order: 7 },
    height: { label: 'Height', order: 8 },
    weight: { label: 'Weight', order: 9 },
    active: { label: 'Currently Playing', order: 10 },
    primaryPosition: { label: 'Position', order: 11 },
    batSide: { label: 'Batting Side', order: 12 },
    pitchHand: { label: 'Pitching Hand', order: 13 },
    hallOfFamer: { label: 'Hall of Famer', order: 14 },
    draftYear: { label: 'Draft Year', order: 15 },
    mlbDebutDate: { label: 'MLB Debut Date', order: 16 },
    lastPlayedDate: { label: 'Last Played Date', order: 17 },
    useName: { label: 'Use Name', order: 18 },
    useLastName: { label: 'Use Last Name', order: 19 },
    middleName: { label: 'Middle Name', order: 20 },
    nickName: { label: 'Nickname', order: 21 },
};

// Based on Baseball Reference's Standard Batting table
export const hittingStatMappings: Record<string, StatMapping> = {
    season: { label: 'Season', order: 1 },
    team: { label: 'Team', order: 2 },
    gamesPlayed: { label: 'G', order: 3 },
    plateAppearances: { label: 'PA', order: 4 },
    atBats: { label: 'AB', order: 5 },
    runs: { label: 'R', order: 6 },
    hits: { label: 'H', order: 7 },
    doubles: { label: '2B', order: 8 },
    triples: { label: '3B', order: 9 },
    homeRuns: { label: 'HR', order: 10 },
    rbi: { label: 'RBI', order: 11 },
    stolenBases: { label: 'SB', order: 12 },
    caughtStealing: { label: 'CS', order: 13 },
    baseOnBalls: { label: 'BB', order: 14 },
    strikeOuts: { label: 'SO', order: 15 },
    avg: { label: 'AVG', order: 16 },
    obp: { label: 'OBP', order: 17 },
    slg: { label: 'SLG', order: 18 },
    ops: { label: 'OPS', order: 19 },
    totalBases: { label: 'TB', order: 20 },
    groundIntoDoublePlay: { label: 'GDP', order: 21 },
    hitByPitch: { label: 'HBP', order: 22 },
    intentionalWalks: { label: 'IBB', order: 23 },
    stolenBasePercentage: { label: 'SB%', order: 24 },
    babip: { label: 'BABIP', order: 25 },
    awards: { label: 'Awards', order: 26 },
};

// Based on Baseball Reference's Standard Pitching table
export const pitchingStatMappings: Record<string, StatMapping> = {
    season: { label: 'Season', order: 1 },
    team: { label: 'Team', order: 2 },
    wins: { label: 'W', order: 3 },
    losses: { label: 'L', order: 4 },
    winPercentage: { label: 'W-L%', order: 5 },
    era: { label: 'ERA', order: 6 },
    gamesPlayed: { label: 'G', order: 7 },
    gamesStarted: { label: 'GS', order: 8 },
    completeGames: { label: 'CG', order: 9 },
    shutouts: { label: 'SHO', order: 10 },
    saves: { label: 'SV', order: 11 },
    inningsPitched: { label: 'IP', order: 12 },
    hits: { label: 'H', order: 13 },
    runs: { label: 'R', order: 14 },
    earnedRuns: { label: 'ER', order: 15 },
    homeRuns: { label: 'HR', order: 16 },
    baseOnBalls: { label: 'BB', order: 17 },
    intentionalWalks: { label: 'IBB', order: 18 },
    strikeOuts: { label: 'SO', order: 19 },
    hitByPitch: { label: 'HBP', order: 20 },
    balks: { label: 'BK', order: 21 },
    whip: { label: 'WHIP', order: 22 },
    strikeoutsPer9Inn: { label: 'SO9', order: 23 },
    walksPer9Inn: { label: 'BB9', order: 24 },
    hitsPer9Inn: { label: 'H9', order: 25 },
    homeRunsPer9: { label: 'HR9', order: 26 },
    strikeoutWalkRatio: { label: 'SO/W', order: 27 },
    battersFaced: { label: 'BF', order: 28 },
    saveOpportunities: { label: 'SVO', order: 29 },
    holds: { label: 'HLD', order: 30 },
    blownSaves: { label: 'BS', order: 31 },
    awards: { label: 'Awards', order: 32 },
};

// Award mappings
export const awardsMappings: Record<string, StatMapping> = {
    season: { label: 'Season', order: 1 },
    awards: { label: 'Awards', order: 2 },
}; 
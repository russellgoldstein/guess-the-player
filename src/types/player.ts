export interface PlayerPosition {
    code: string;
    name: string;
    type: string;
    abbreviation: string;
}

export interface Player {
    id: number;
    fullName: string;
}

export interface PlayerInfo {
    firstName: string;
    lastName: string;
    fullName: string;
    primaryNumber: string;
    birthDate: string;
    birthCity: string;
    birthStateProvince: string;
    birthCountry: string;
    height: string;
    weight: number;
    active: boolean;
    primaryPosition: string;
    useName: string;
    useLastName: string;
    middleName: string;
    nickName: string;
    draftYear: number;
    lastPlayedDate: string;
    mlbDebutDate: string;
    batSide: string;
    pitchHand: string;
    imageUrl?: string;
}

export interface StatEntry<T> {
    stat: T;
}

export interface HittingStats {
    team: string;
    season: string;
    gamesPlayed: number;
    runs: number;
    doubles: number;
    triples: number;
    homeRuns: number;
    strikeOuts: number;
    baseOnBalls: number;
    intentionalWalks: number;
    hits: number;
    hitByPitch: number;
    avg: string;
    atBats: number;
    obp: string;
    slg: string;
    ops: string;
    caughtStealing: number;
    stolenBases: number;
    stolenBasePercentage: string;
    groundIntoDoublePlay: number;
    plateAppearances: number;
    totalBases: number;
    rbi: number;
    babip: string;
}

export interface PitchingStats {
    team: string;
    season: string;
    gamesPlayed: number;
    gamesStarted: number;
    completeGames: number;
    shutouts: number;
    wins: number;
    losses: number;
    saves: number;
    saveOpportunities: number;
    holds: number;
    blownSaves: number;
    inningsPitched: string;
    strikeOuts: number;
    baseOnBalls: number;
    intentionalWalks: number;
    hits: number;
    runs: number;
    earnedRuns: number;
    homeRuns: number;
    era: string;
    whip: string;
    avg: string;
    strikeoutsPer9Inn: string;
    walksPer9Inn: string;
    hitsPer9Inn: string;
    homeRunsPer9: string;
    strikeoutWalkRatio: string;
}

export interface PlayerStatsProps {
    playerId: number;
    configurable?: boolean;
    selectedInfo: string[];
    deselectedInfo: string[];
    selectedHittingStats: string[];
    deselectedHittingStats: string[];
    selectedPitchingStats: string[];
    deselectedPitchingStats: string[];
    onStatsChange: (type: 'info' | 'hitting' | 'pitching', selected: string[], deselected: string[]) => void;
}

export interface Game {
    id: string;
    title: string;
    creator_id: string;
    created_at: string;
    game_player_config: GamePlayerConfig[];
}

export interface GamePlayerConfig {
    id: string;
    game_id: string;
    player_id: number;
    stats_config: {
        info: {
            selected: string[];
            deselected: string[];
        };
        hitting: {
            selected: string[];
            deselected: string[];
        };
        pitching: {
            selected: string[];
            deselected: string[];
        };
    };
} 
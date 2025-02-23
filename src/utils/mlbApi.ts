import { PlayerInfo, HittingStats, PitchingStats } from '../types/player';

export const MLB_API_BASE_URL = 'https://statsapi.mlb.com/api/v1';

export const EXCLUDED_PLAYER_INFO_FIELDS = [
    'id',
    'fullName',
    'link',
    'currentAge',
    'boxscoreName',
    'gender',
    'isPlayer',
    'isVerified',
    'nameFirstLast',
    'nameSlug',
    'firstLastName',
    'lastFirstName',
    'lastInitName',
    'initLastName',
    'fullFMLName',
    'fullLFMName',
    'strikeZoneTop',
    'strikeZoneBottom',
    'stats'
];

export const EXCLUDED_HITTING_STATS_FIELDS = [
    'groundOuts',
    'airOuts',
    'numberOfPitches',
    'sacBunts',
    'sacFlies',
    'groundOutsToAirouts',
    'catchersInterference',
    'atBatsPerHomeRun',
    'leftOnBase',
];

export const EXCLUDED_PITCHING_STATS_FIELDS = [
    'gamesPitched',
    'groundOuts',
    'airOuts',
    'numberOfPitches',
    'wildPitches',
    'pickoffs',
    'groundOutsToAirouts',
    'pitchesPerInning',
    'gamesFinished',
    'inheritedRunners',
    'inheritedRunnersScored',
    'catchersInterference',
    'sacBunts',
    'sacFlies',
    'leftOnBase',
    'doubles',
    'hitBatsmen',
    'outs',
    'runsScoredPer9',
    'stolenBasePercentage',
    'stolenBases',
    'strikes',
    'triples',
    'caughtStealing',
    'strikePercentage',
];

export const filterPlayerInfo = (playerData: any): Partial<PlayerInfo> => {
    const filteredData = { ...playerData };

    // Extract nested fields
    filteredData.primaryPosition = playerData.primaryPosition?.name || '';
    filteredData.batSide = playerData.batSide?.description || '';
    filteredData.pitchHand = playerData.pitchHand?.description || '';
    filteredData.imageUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerData.id}/headshot/67/current`;
    // Remove excluded fields
    EXCLUDED_PLAYER_INFO_FIELDS.forEach(field => {
        delete filteredData[field];
    });

    return filteredData;
};

interface StatEntry {
    season: string;
    stat: Record<string, any>;
    team: {
        name: string;
    };
    numTeams?: number;
}

export const filterHittingStats = (statsData: StatEntry[]): Partial<HittingStats>[] => {
    // Group stats by season
    const statsBySeason = statsData.reduce((acc, entry) => {
        const season = entry.season;
        if (!acc[season]) {
            acc[season] = [];
        }
        acc[season].push(entry);
        return acc;
    }, {} as Record<string, StatEntry[]>);

    // For each season, if there are multiple entries, use the one with numTeams
    const filteredStats = Object.values(statsBySeason).map((seasonEntries: StatEntry[]) => {
        if (seasonEntries.length === 1) {
            return seasonEntries[0];
        }
        // If multiple entries, find the one with numTeams (full season stats)
        const fullSeasonEntry = seasonEntries.find(entry => entry.numTeams);
        return fullSeasonEntry || seasonEntries[0];
    });

    return filteredStats.map(entry => {
        const filteredEntry = { ...entry.stat };

        // Remove excluded fields
        EXCLUDED_HITTING_STATS_FIELDS.forEach(field => {
            delete filteredEntry[field];
        });

        filteredEntry.season = entry.season;
        if (entry.numTeams && entry.numTeams > 1) {
            filteredEntry.team = `${entry.numTeams} Teams`;
        } else {
            filteredEntry.team = entry.team.name;
        }
        return filteredEntry;
    });
};

export const filterPitchingStats = (statsData: StatEntry[]): Partial<PitchingStats>[] => {
    // Group stats by season
    const statsBySeason = statsData.reduce((acc, entry) => {
        const season = entry.season;
        if (!acc[season]) {
            acc[season] = [];
        }
        acc[season].push(entry);
        return acc;
    }, {} as Record<string, StatEntry[]>);

    // For each season, if there are multiple entries, use the one with numTeams
    const filteredStats = Object.values(statsBySeason).map((seasonEntries: StatEntry[]) => {
        if (seasonEntries.length === 1) {
            return seasonEntries[0];
        }
        // If multiple entries, find the one with numTeams (full season stats)
        const fullSeasonEntry = seasonEntries.find(entry => entry.numTeams);
        return fullSeasonEntry || seasonEntries[0];
    });

    return filteredStats.map(entry => {
        const filteredEntry = { ...entry.stat };

        // Remove excluded fields
        EXCLUDED_PITCHING_STATS_FIELDS.forEach(field => {
            delete filteredEntry[field];
        });

        filteredEntry.season = entry.season;
        if (entry.numTeams && entry.numTeams > 1) {
            filteredEntry.team = `${entry.numTeams} Teams`;
        } else {
            filteredEntry.team = entry.team.name;
        }
        return filteredEntry;
    });
};

export const fetchPlayerData = async (playerId: string | number) => {
    try {
        const [playerResponse, pitchingResponse] = await Promise.all([
            fetch(`${MLB_API_BASE_URL}/people/${playerId}?hydrate=stats(group=hitting,type=yearByYear)`),
            fetch(`${MLB_API_BASE_URL}/people/${playerId}?hydrate=stats(group=pitching,type=yearByYear)`)
        ]);

        const [playerData, pitchingData] = await Promise.all([
            playerResponse.json(),
            pitchingResponse.json()
        ]);

        const result = {
            playerInfo: null as Partial<PlayerInfo> | null,
            hittingStats: [] as Partial<HittingStats>[],
            pitchingStats: [] as Partial<PitchingStats>[]
        };

        if (playerData.people?.[0]) {
            result.playerInfo = filterPlayerInfo(playerData.people[0]);

            if (playerData.people[0].stats?.[0]?.splits) {
                result.hittingStats = filterHittingStats(playerData.people[0].stats[0].splits);
            }
        }

        if (pitchingData.people?.[0]?.stats?.[0]?.splits) {
            result.pitchingStats = filterPitchingStats(pitchingData.people[0].stats[0].splits);
        }

        return result;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}; 
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

export const ALLOWED_AWARD_IDS = [
    // National League Awards
    'NLAS',    // NL All-Star
    'NLGG',    // Rawlings NL Gold Glove
    'NLCY',    // NL Cy Young
    'NLROY',   // Jackie Robinson NL Rookie of the Year
    'NLSS',    // NL Silver Slugger
    'NLMVP',   // NL MVP

    // American League Awards (same awards but for AL)
    'ALAS',    // AL All-Star
    'ALGG',    // Rawlings AL Gold Glove
    'ALCY',    // AL Cy Young
    'ALROY',   // Jackie Robinson AL Rookie of the Year
    'ALSS',    // AL Silver Slugger
    'ALMVP',   // AL MVP

    // Hall of Fame
    'MLBHOF'   // MLB Hall of Fame
];

export const filterPlayerInfo = (playerData: any, awardsData: any[] = []): Partial<PlayerInfo> => {
    const filteredData = { ...playerData };

    // Extract nested fields
    filteredData.primaryPosition = playerData.primaryPosition?.name || '';
    filteredData.batSide = playerData.batSide?.description || '';
    filteredData.pitchHand = playerData.pitchHand?.description || '';
    filteredData.imageUrl = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerData.id}/headshot/67/current`;

    // Add Hall of Fame status
    filteredData.hallOfFamer = awardsData.some(award => award.id === 'MLBHOF') ? 'Yes' : 'No';

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

export const filterHittingStats = (statsData: StatEntry[], awards: Record<string, string[]> = {}, birthDate?: string): Partial<HittingStats>[] => {
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

        // Calculate player's age as of April 1st of the season year
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const seasonYear = parseInt(entry.season);
            const seasonStartDate = new Date(seasonYear, 3, 1); // April 1st (months are 0-indexed)
            const ageInMilliseconds = seasonStartDate.getTime() - birthDateObj.getTime();
            const ageDate = new Date(ageInMilliseconds);
            // Calculate age (year 1970 is the epoch start)
            filteredEntry.age = Math.abs(ageDate.getUTCFullYear() - 1970);
        } else {
            filteredEntry.age = '';
        }

        // Add awards for this season if they exist, otherwise set to empty string
        filteredEntry.awards = awards[entry.season] && awards[entry.season].length > 0
            ? awards[entry.season].join(', ')
            : '';

        return filteredEntry;
    });
};

export const filterPitchingStats = (statsData: StatEntry[], awards: Record<string, string[]> = {}, birthDate?: string): Partial<PitchingStats>[] => {
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

        // Calculate player's age as of April 1st of the season year
        if (birthDate) {
            const birthDateObj = new Date(birthDate);
            const seasonYear = parseInt(entry.season);
            const seasonStartDate = new Date(seasonYear, 3, 1); // April 1st (months are 0-indexed)
            const ageInMilliseconds = seasonStartDate.getTime() - birthDateObj.getTime();
            const ageDate = new Date(ageInMilliseconds);
            // Calculate age (year 1970 is the epoch start)
            filteredEntry.age = Math.abs(ageDate.getUTCFullYear() - 1970);
        } else {
            filteredEntry.age = '';
        }

        // Add awards for this season if they exist, otherwise set to empty string
        filteredEntry.awards = awards[entry.season] && awards[entry.season].length > 0
            ? awards[entry.season].join(', ')
            : '';

        return filteredEntry;
    });
};

export const filterAndMapAwards = (awardsData: any[]): Record<string, string[]> => {
    if (!awardsData || !Array.isArray(awardsData)) {
        return {};
    }

    // Debug log to see all awards before filtering
    console.log('All awards before filtering:', awardsData.map(a => ({ id: a.id, name: a.name })));

    // Only include the specific major awards by ID
    const majorAwards = awardsData.filter(award =>
        ALLOWED_AWARD_IDS.includes(award.id)
    );

    // Debug log to see filtered awards
    console.log('Filtered major awards:', majorAwards.map(a => ({ id: a.id, name: a.name })));

    // Group awards by season
    const awardsBySeason: Record<string, string[]> = {};

    majorAwards.forEach(award => {
        const season = award.season;
        if (!season) return;

        if (!awardsBySeason[season]) {
            awardsBySeason[season] = [];
        }

        awardsBySeason[season].push(award.name);
    });

    return awardsBySeason;
};

export const fetchPlayerData = async (playerId: string | number) => {
    try {
        const [playerResponse, pitchingResponse] = await Promise.all([
            fetch(`${MLB_API_BASE_URL}/people/${playerId}?hydrate=stats(group=hitting,type=yearByYear),awards`),
            fetch(`${MLB_API_BASE_URL}/people/${playerId}?hydrate=stats(group=pitching,type=yearByYear),awards`)
        ]);

        const [playerData, pitchingData] = await Promise.all([
            playerResponse.json(),
            pitchingResponse.json()
        ]);

        const result = {
            playerInfo: null as Partial<PlayerInfo> | null,
            hittingStats: [] as Partial<HittingStats>[],
            pitchingStats: [] as Partial<PitchingStats>[],
            awards: {} as Record<string, string[]>
        };

        if (playerData.people?.[0]) {
            // Process awards data first so we can use it in filterPlayerInfo
            const awardsData = playerData.people[0].awards || [];
            result.awards = filterAndMapAwards(awardsData);

            // Get the player's birth date
            const birthDate = playerData.people[0].birthDate;

            // Pass the awards data to filterPlayerInfo
            result.playerInfo = filterPlayerInfo(playerData.people[0], awardsData);

            if (playerData.people[0].stats?.[0]?.splits) {
                result.hittingStats = filterHittingStats(playerData.people[0].stats[0].splits, result.awards, birthDate);
            }

            if (pitchingData.people?.[0]?.stats?.[0]?.splits) {
                result.pitchingStats = filterPitchingStats(pitchingData.people[0].stats[0].splits, result.awards, birthDate);
            }
        }

        return result;
    } catch (error) {
        console.error('Error fetching player data:', error);
        throw error;
    }
}; 
import React, { useEffect, useState } from 'react';

interface PlayerInfo {
    fullName: string;
    firstName: string;
    lastName: string;
    primaryNumber: string;
    birthDate: string;
    birthCity: string;
    birthStateProvince: string;
    birthCountry: string;
    height: string;
    weight: number;
    active: boolean;
    primaryPosition: {
        code: string;
        name: string;
        type: string;
        abbreviation: string;
    };
    useName: string;
    useLastName: string;
    middleName: string;
    boxscoreName: string;
    nickName: string;
    gender: string;
    deathDate?: string;
    deathCity?: string;
    deathStateProvince?: string;
    deathCountry?: string;
    lastPlayedDate?: string;
}

interface PlayerStatsProps {
    playerId: number;
    configurable?: boolean;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({ playerId, configurable = false }) => {
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    const [hittingStats, setHittingStats] = useState<any[]>([]);
    const [pitchingStats, setPitchingStats] = useState<any[]>([]);
    const [selectedInfo, setSelectedInfo] = useState<string[]>([]);
    const [deselectedInfo, setDeselectedInfo] = useState<string[]>([]);
    const [selectedHittingStats, setSelectedHittingStats] = useState<string[]>([]);
    const [deselectedHittingStats, setDeselectedHittingStats] = useState<string[]>([]);
    const [selectedPitchingStats, setSelectedPitchingStats] = useState<string[]>([]);
    const [deselectedPitchingStats, setDeselectedPitchingStats] = useState<string[]>([]);

    useEffect(() => {
        const fetchPlayerData = async () => {
            try {
                const response = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=hitting,type=yearByYear)`);
                const data = await response.json();
                if (data.people && data.people[0]) {
                    setPlayerInfo(data.people[0]);
                    if (data.people[0].stats && data.people[0].stats[0] && data.people[0].stats[0].splits) {
                        setHittingStats(data.people[0].stats[0].splits);
                    }
                }

                const pitchingResponse = await fetch(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=stats(group=pitching,type=yearByYear)`);
                const pitchingData = await pitchingResponse.json();
                if (pitchingData.people && pitchingData.people[0] && pitchingData.people[0].stats && pitchingData.people[0].stats[0] && pitchingData.people[0].stats[0].splits) {
                    setPitchingStats(pitchingData.people[0].stats[0].splits);
                }
            } catch (error) {
                console.error('Error fetching player data:', error);
            }
        };

        fetchPlayerData();
    }, [playerId]);

    useEffect(() => {
        if (playerInfo) {
            setSelectedInfo(Object.keys(playerInfo));
        }
        if (configurable) {
            if (hittingStats.length > 0) {
                setSelectedHittingStats(Object.keys(hittingStats[0].stat));
            }
            if (pitchingStats.length > 0) {
                setSelectedPitchingStats(Object.keys(pitchingStats[0].stat));
            }
        }
    }, [playerInfo, hittingStats.length, pitchingStats.length, configurable]);

    const toggleAttribute = (attribute: string, type: 'info' | 'hitting' | 'pitching') => {
        const toggle = (selected: string[], deselected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>, setDeselected: React.Dispatch<React.SetStateAction<string[]>>) => {
            if (selected.includes(attribute)) {
                setSelected(selected.filter(attr => attr !== attribute));
                setDeselected([...deselected, attribute]);
            } else {
                setDeselected(deselected.filter(attr => attr !== attribute));
                setSelected([...selected, attribute]);
            }
        };

        if (type === 'info') {
            toggle(selectedInfo, deselectedInfo, setSelectedInfo, setDeselectedInfo);
        } else if (type === 'hitting') {
            toggle(selectedHittingStats, deselectedHittingStats, setSelectedHittingStats, setDeselectedHittingStats);
        } else if (type === 'pitching') {
            toggle(selectedPitchingStats, deselectedPitchingStats, setSelectedPitchingStats, setDeselectedPitchingStats);
        }
    };

    if (!playerInfo) return <div>Loading...</div>;

    const humanReadablePlayerInfoNames: Record<string, string> = {
        id: 'Player ID',
        fullName: 'Full Name',
        link: 'Player Link',
        firstName: 'First Name',
        lastName: 'Last Name',
        primaryNumber: 'Primary Number',
        birthDate: 'Birth Date',
        currentAge: 'Current Age',
        birthCity: 'Birth City',
        birthStateProvince: 'Birth State/Province',
        birthCountry: 'Birth Country',
        height: 'Height',
        weight: 'Weight',
        active: 'Active',
        primaryPosition: 'Primary Position',
        useName: 'Use Name',
        useLastName: 'Use Last Name',
        middleName: 'Middle Name',
        boxscoreName: 'Boxscore Name',
        gender: 'Gender',
        isPlayer: 'Is Player',
        isVerified: 'Is Verified',
        draftYear: 'Draft Year',
        lastPlayedDate: 'Last Played Date',
        mlbDebutDate: 'MLB Debut Date',
        batSide: 'Batting Side',
        pitchHand: 'Pitching Hand',
        nameFirstLast: 'Name (First Last)',
        nameSlug: 'Name Slug',
        firstLastName: 'First Last Name',
        lastFirstName: 'Last First Name',
        lastInitName: 'Last Initial Name',
        initLastName: 'Initial Last Name',
        fullFMLName: 'Full First Middle Last Name',
        fullLFMName: 'Full Last First Middle Name',
        strikeZoneTop: 'Strike Zone Top',
        strikeZoneBottom: 'Strike Zone Bottom',
    };
    const humanReadablePlayerHittingStatsNames: Record<string, string> = {
        gamesPlayed: 'GP',
        groundOuts: 'GO',
        airOuts: 'AO',
        runs: 'R',
        doubles: '2B',
        triples: '3B',
        homeRuns: 'HR',
        strikeOuts: 'SO',
        baseOnBalls: 'BB',
        intentionalWalks: 'IW',
        hits: 'H',
        hitByPitch: 'HBP',
        avg: 'AVG',
        atBats: 'AB',
        obp: 'OBP',
        slg: 'SLG',
        ops: 'OPS',
        caughtStealing: 'CS',
        stolenBases: 'SB',
        stolenBasePercentage: 'SB%',
        groundIntoDoublePlay: 'GIDP',
        numberOfPitches: 'P',
        plateAppearances: 'PA',
        totalBases: 'TB',
        rbi: 'RBI',
        leftOnBase: 'LOB',
        sacBunts: 'SAC',
        sacFlies: 'SAC',
        babip: 'BABIP',
        groundOutsToAirouts: 'GO/AO',
        catchersInterference: 'CI',
        atBatsPerHomeRun: 'AB/HR',
    };

    console.log(playerInfo);
    console.log(hittingStats);
    console.log(pitchingStats);

    return (
        <div className="p-4">
            <h2 className="text-2xl font-bold mb-4">{playerInfo.fullName}</h2>
            <div className="mb-4">
                {Object.entries(playerInfo || {}).map(([key, value]) => {
                    const humanReadableKey = humanReadablePlayerInfoNames[key] || key;
                    if (typeof value === 'object' && value !== null) {
                        return (
                            <div key={key}>
                                <strong>{humanReadableKey}:</strong>
                                {Object.entries(value).map(([subKey, subValue]) => (
                                    <p key={subKey} className={configurable && selectedInfo.includes(subKey) ? 'text-green-500 cursor-pointer' : 'text-red-500 cursor-pointer'} onClick={() => configurable && toggleAttribute(subKey, 'info')}>
                                        <strong>{subKey}:</strong> {String(subValue)}
                                    </p>
                                ))}
                            </div>
                        );
                    }
                    return (
                        <p key={key} className={configurable && selectedInfo.includes(key) ? 'text-green-500 cursor-pointer' : 'text-red-500 cursor-pointer'} onClick={() => configurable && toggleAttribute(key, 'info')}>
                            <strong>{humanReadableKey}:</strong> {String(value)}
                        </p>
                    );
                })}
            </div>

            {hittingStats.length > 0 && (
                <>
                    <h3 className="text-xl font-semibold mb-2">Hitting Stats</h3>
                    <table className="w-full mb-4">
                        <thead>
                            <tr>
                                {Object.keys(hittingStats[0].stat).map((key) => (
                                    <th key={key} className={configurable && selectedHittingStats.includes(key) ? 'text-green-500 cursor-pointer' : 'text-red-500 cursor-pointer'} onClick={() => configurable && toggleAttribute(key, 'hitting')}>
                                        {humanReadablePlayerHittingStatsNames[key] || key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hittingStats.map((stat, index) => (
                                <tr key={index}>
                                    {Object.entries(stat.stat).map(([key, value]) => (
                                        <td key={key} className={configurable && selectedHittingStats.includes(key) ? '' : configurable ? '' : ''}>
                                            {String(value)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
            {pitchingStats.length > 0 && (
                <>
                    <h3 className="text-xl font-semibold mb-2">Pitching Stats</h3>
                    <table className="w-full">
                        <thead>
                            <tr>
                                {Object.keys(pitchingStats[0].stat).map((key) => (
                                    <th key={key} className={configurable && selectedPitchingStats.includes(key) ? 'text-green-500 cursor-pointer' : 'text-red-500 cursor-pointer'} onClick={() => configurable && toggleAttribute(key, 'pitching')}>
                                        {key}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pitchingStats.map((stat, index) => (
                                <tr key={index}>
                                    {Object.entries(stat.stat).map(([key, value]) => (
                                        <td key={key} className={configurable && selectedPitchingStats.includes(key) ? '' : configurable ? 'hidden' : ''}>
                                            {String(value)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default PlayerStats; 
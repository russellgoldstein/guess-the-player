import React, { useEffect, useState } from 'react';
import { playerInfoMappings, hittingStatMappings, pitchingStatMappings, StatMapping } from '../utils/statMappings';
import { PlayerInfo, PlayerStatsProps, HittingStats, PitchingStats } from '../types/player';
import { ConfigurableHeader } from './ConfigurableHeader';
import { ConfigurableText } from './ConfigurableText';
import { SectionToggle } from './SectionToggle';
import { fetchPlayerData } from '../utils/mlbApi';

const PlayerStats: React.FC<PlayerStatsProps> = ({
    playerId,
    configurable = false,
    selectedInfo,
    deselectedInfo,
    selectedHittingStats,
    deselectedHittingStats,
    selectedPitchingStats,
    deselectedPitchingStats,
    onStatsChange
}) => {
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    const [hittingStats, setHittingStats] = useState<Partial<HittingStats>[]>([]);
    const [pitchingStats, setPitchingStats] = useState<Partial<PitchingStats>[]>([]);

    useEffect(() => {
        const loadPlayerData = async () => {
            try {
                const data = await fetchPlayerData(playerId);

                if (data.playerInfo) {
                    setPlayerInfo(data.playerInfo as PlayerInfo);
                    if (configurable && selectedInfo.length === 0) {
                        onStatsChange('info', Object.keys(data.playerInfo), []);
                    }
                }

                if (data.hittingStats.length > 0) {
                    setHittingStats(data.hittingStats);
                    if (configurable && selectedHittingStats.length === 0) {
                        onStatsChange('hitting', Object.keys(data.hittingStats[0]), []);
                    }
                }

                if (data.pitchingStats.length > 0) {
                    setPitchingStats(data.pitchingStats);
                    if (configurable && selectedPitchingStats.length === 0) {
                        onStatsChange('pitching', Object.keys(data.pitchingStats[0]), []);
                    }
                }
            } catch (error) {
                console.error('Error loading player data:', error);
            }
        };

        loadPlayerData();
    }, [playerId, configurable]);

    const toggleAttribute = (attribute: string, type: 'info' | 'hitting' | 'pitching') => {
        let selected: string[];
        let deselected: string[];

        if (type === 'info') {
            selected = [...selectedInfo];
            deselected = [...deselectedInfo];
        } else if (type === 'hitting') {
            selected = [...selectedHittingStats];
            deselected = [...deselectedHittingStats];
        } else {
            selected = [...selectedPitchingStats];
            deselected = [...deselectedPitchingStats];
        }

        if (selected.includes(attribute)) {
            selected = selected.filter(attr => attr !== attribute);
            deselected.push(attribute);
        } else {
            deselected = deselected.filter(attr => attr !== attribute);
            selected.push(attribute);
        }

        onStatsChange(type, selected, deselected);
    };

    const handleToggle = (key: string, type: 'info' | 'hitting' | 'pitching') => {
        toggleAttribute(key, type);
    };

    const handleToggleAll = (type: 'info' | 'hitting' | 'pitching', selectedKeys: string[]) => {
        let allKeys: string[] = [];
        let deselectedKeys: string[] = [];

        if (type === 'info' && playerInfo) {
            allKeys = Object.keys(playerInfo);
        } else if (type === 'hitting' && hittingStats.length > 0) {
            allKeys = Object.keys(hittingStats[0]);
        } else if (type === 'pitching' && pitchingStats.length > 0) {
            allKeys = Object.keys(pitchingStats[0]);
        }

        if (selectedKeys.length === 0) {
            // If no keys are selected, all should be deselected
            deselectedKeys = allKeys;
        } else {
            // If keys are selected, only the non-selected ones should be deselected
            deselectedKeys = allKeys.filter(key => !selectedKeys.includes(key));
        }

        onStatsChange(type, selectedKeys, deselectedKeys);
    };

    const filterVisibleStats = <T extends object>(stats: T, selectedKeys: string[]): T => {
        if (configurable) {
            return stats;
        }
        const filteredStats = { ...stats };
        Object.keys(stats).forEach(key => {
            const k = key as keyof T;
            if (!selectedKeys.includes(key)) {
                (filteredStats[k] as unknown) = '---';
            }
        });
        return filteredStats;
    };

    const getSortedKeys = <T extends Record<string, any>>(obj: T, mappings: Record<string, StatMapping>): (keyof T)[] => {
        return (Object.keys(obj) as (keyof T)[])
            .filter(key => key in mappings)
            .sort((a, b) => (mappings[String(a)]?.order || 0) - (mappings[String(b)]?.order || 0));
    };

    if (!playerInfo) return <div>Loading...</div>;

    const visiblePlayerInfo = filterVisibleStats(playerInfo, selectedInfo);
    const hasVisibleInfo = configurable || selectedInfo.length > 0;
    const hasVisibleHitting = configurable || selectedHittingStats.length > 0;
    const hasVisiblePitching = configurable || selectedPitchingStats.length > 0;

    const sortedInfoKeys = getSortedKeys(visiblePlayerInfo, playerInfoMappings);
    const sortedHittingKeys = hittingStats.length > 0 ? getSortedKeys(hittingStats[0], hittingStatMappings) : [];
    const sortedPitchingKeys = pitchingStats.length > 0 ? getSortedKeys(pitchingStats[0], pitchingStatMappings) : [];

    return (
        <div className="p-4">
            {hasVisibleInfo && (
                <>
                    <SectionToggle
                        title="Player Info"
                        configurable={configurable}
                        allKeys={sortedInfoKeys}
                        selectedKeys={selectedInfo}
                        onToggleAll={(keys) => handleToggleAll('info', keys)}
                    />
                    <div className="mb-4">
                        {sortedInfoKeys.map((key) => {
                            const value = visiblePlayerInfo[key];
                            const humanReadableKey = playerInfoMappings[key]?.label || key;
                            if (typeof value === 'object' && value !== null) {
                                return (
                                    <div key={key}>
                                        <strong>{humanReadableKey}:</strong>
                                        {Object.entries(value).map(([subKey, subValue]) => (
                                            <ConfigurableText
                                                key={subKey}
                                                itemKey={subKey}
                                                displayName={subKey}
                                                value={String(subValue)}
                                                configurable={configurable}
                                                selected={selectedInfo}
                                                deselected={deselectedInfo}
                                                onToggle={(key) => handleToggle(key, 'info')}
                                            />
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <ConfigurableText
                                    key={key}
                                    itemKey={key}
                                    displayName={humanReadableKey}
                                    value={String(value)}
                                    configurable={configurable}
                                    selected={selectedInfo}
                                    deselected={deselectedInfo}
                                    onToggle={(key) => handleToggle(key, 'info')}
                                />
                            );
                        })}
                    </div>
                </>
            )}

            {hittingStats.length > 0 && hasVisibleHitting && (
                <>
                    <SectionToggle
                        title="Hitting Stats"
                        configurable={configurable}
                        allKeys={sortedHittingKeys}
                        selectedKeys={selectedHittingStats}
                        onToggleAll={(keys) => handleToggleAll('hitting', keys)}
                    />
                    <table className="w-full mb-4">
                        <thead>
                            <tr>
                                {sortedHittingKeys.map((key) => (
                                    <ConfigurableHeader
                                        key={key}
                                        statKey={key}
                                        displayName={hittingStatMappings[key]?.label || key}
                                        configurable={configurable}
                                        selected={selectedHittingStats}
                                        deselected={deselectedHittingStats}
                                        onToggle={(key) => handleToggle(key, 'hitting')}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {hittingStats.map((stat, index) => {
                                const visibleStats = filterVisibleStats<HittingStats>(stat as HittingStats, selectedHittingStats);
                                return (
                                    <tr key={index}>
                                        {sortedHittingKeys.map(key => (
                                            <td key={key}>
                                                {String(visibleStats[key as keyof HittingStats])}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
            {pitchingStats.length > 0 && hasVisiblePitching && (
                <>
                    <SectionToggle
                        title="Pitching Stats"
                        configurable={configurable}
                        allKeys={sortedPitchingKeys}
                        selectedKeys={selectedPitchingStats}
                        onToggleAll={(keys) => handleToggleAll('pitching', keys)}
                    />
                    <table className="w-full">
                        <thead>
                            <tr>
                                {sortedPitchingKeys.map((key) => (
                                    <ConfigurableHeader
                                        key={key}
                                        statKey={key}
                                        displayName={pitchingStatMappings[key]?.label || key}
                                        configurable={configurable}
                                        selected={selectedPitchingStats}
                                        deselected={deselectedPitchingStats}
                                        onToggle={(key) => handleToggle(key, 'pitching')}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pitchingStats.map((stat, index) => {
                                const visibleStats = filterVisibleStats<PitchingStats>(stat as PitchingStats, selectedPitchingStats);
                                return (
                                    <tr key={index}>
                                        {sortedPitchingKeys.map(key => (
                                            <td key={key}>
                                                {String(visibleStats[key as keyof PitchingStats])}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}
            {!hasVisibleInfo && !hasVisibleHitting && !hasVisiblePitching && (
                <div className="text-center text-gray-500 py-8">
                    No stats selected to display
                </div>
            )}
        </div>
    );
};

export default PlayerStats; 
import React, { useEffect, useState } from 'react';
import { playerInfoMappings, hittingStatMappings, pitchingStatMappings, StatMapping } from '../utils/statMappings';
import { PlayerInfo, PlayerStatsProps, HittingStats, PitchingStats } from '../types/player';
import { ConfigurableHeader } from './ConfigurableHeader';
import { ConfigurableText } from './ConfigurableText';
import { SectionToggle } from './SectionToggle';
import { fetchPlayerData } from '../utils/mlbApi';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
                    if (configurable) {
                        // Initialize all player info stats as deselected
                        onStatsChange('info', [], Object.keys(data.playerInfo));
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
                (filteredStats[k] as unknown) = '-';
            }
        });
        return filteredStats;
    };

    const getSortedKeys = <T extends Record<string, any>>(obj: T, mappings: Record<string, StatMapping>): (keyof T)[] => {
        return (Object.keys(obj) as (keyof T)[])
            .filter(key => key in mappings)
            .sort((a, b) => (mappings[String(a)]?.order || 0) - (mappings[String(b)]?.order || 0));
    };

    const getVisibleKeys = (allKeys: string[], selected: string[], deselected: string[]) => {
        // When configurable is true, show all columns
        if (configurable) {
            return allKeys;
        }
        // When not configurable, only show selected columns
        return allKeys.filter(key => !deselected.includes(key));
    };

    if (!playerInfo) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mlb-blue"></div>
        </div>
    );

    const visiblePlayerInfo = filterVisibleStats(playerInfo, selectedInfo);
    const hasVisibleInfo = configurable || selectedInfo.length > 0;
    const hasVisibleHitting = configurable || selectedHittingStats.length > 0;
    const hasVisiblePitching = configurable || selectedPitchingStats.length > 0;

    const sortedInfoKeys = getSortedKeys(visiblePlayerInfo, playerInfoMappings);
    const sortedHittingKeys = hittingStats.length > 0 ? getSortedKeys(hittingStats[0], hittingStatMappings) : [];
    const sortedPitchingKeys = pitchingStats.length > 0 ? getSortedKeys(pitchingStats[0], pitchingStatMappings) : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 bg-white">
            {/* Player Header */}
            <div className="space-y-6 mb-8">
                <div className="flex gap-6">
                    <div className="shrink-0">
                        <Avatar className="h-32 w-32 rounded-lg border-2 border-gray-100 shadow-sm">
                            <AvatarImage src={configurable === true ? playerInfo.imageUrl : 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/1/headshot/67/current'} alt={configurable === true ? playerInfo.fullName : 'Player'} />
                            <AvatarFallback className="text-3xl bg-mlb-blue text-white">{playerInfo.fullName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-4">
                            <h1 className="text-4xl font-bold text-mlb-blue">{playerInfo.fullName}</h1>
                            {configurable && (
                                <SectionToggle
                                    title=""
                                    configurable={configurable}
                                    allKeys={sortedInfoKeys}
                                    selectedKeys={selectedInfo}
                                    onToggleAll={(keys) => handleToggleAll('info', keys)}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                            {sortedInfoKeys.map((key) => {
                                const value = visiblePlayerInfo[key];
                                const humanReadableKey = playerInfoMappings[key]?.label || key;
                                if (typeof value === 'object' && value !== null) {
                                    return null; // Skip nested objects in the grid
                                }
                                return (
                                    <div
                                        key={key}
                                        className={`bg-gray-50 p-2 rounded-md border transition-colors ${configurable
                                            ? 'cursor-pointer border-gray-100 hover:border-gray-200'
                                            : 'border-gray-100'
                                            }`}
                                        onClick={() => configurable && handleToggle(key, 'info')}
                                    >
                                        <div className="text-xs text-gray-600">{humanReadableKey}</div>
                                        <div className={`text-sm font-semibold ${configurable
                                            ? selectedInfo.includes(key)
                                                ? 'text-green-600'
                                                : deselectedInfo.includes(key)
                                                    ? 'text-red-600'
                                                    : 'text-mlb-blue'
                                            : 'text-mlb-blue'
                                            }`}>
                                            {String(value)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Tabs */}
            <Tabs defaultValue="hitting" className="w-full">
                <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent mb-6 gap-2">
                    {hasVisibleHitting && (
                        <TabsTrigger
                            value="hitting"
                            className="text-lg data-[state=active]:border-b-2 data-[state=active]:border-mlb-blue data-[state=active]:bg-transparent data-[state=active]:text-mlb-blue px-6 rounded-none"
                        >
                            Hitting
                        </TabsTrigger>
                    )}
                    {hasVisiblePitching && (
                        <TabsTrigger
                            value="pitching"
                            className="text-lg data-[state=active]:border-b-2 data-[state=active]:border-mlb-blue data-[state=active]:bg-transparent data-[state=active]:text-mlb-blue px-6 rounded-none"
                        >
                            Pitching
                        </TabsTrigger>
                    )}
                </TabsList>

                {hasVisibleHitting && (
                    <TabsContent value="hitting">
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="border-b border-gray-100 bg-gray-50">
                                <CardTitle className="flex items-center justify-between text-mlb-blue">
                                    Hitting Statistics
                                    {configurable && (
                                        <SectionToggle
                                            title=""
                                            configurable={configurable}
                                            allKeys={sortedHittingKeys}
                                            selectedKeys={selectedHittingStats}
                                            onToggleAll={(keys) => handleToggleAll('hitting', keys)}
                                        />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 w-full">
                                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <Table className="w-full table-auto">
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-100">
                                                {getVisibleKeys(sortedHittingKeys, selectedHittingStats, deselectedHittingStats).map((key) => (
                                                    <TableHead
                                                        key={key}
                                                        className="text-left whitespace-nowrap font-medium text-gray-600 py-2 px-2 first:pl-4 last:pr-4 text-xs"
                                                    >
                                                        <ConfigurableHeader
                                                            statKey={key}
                                                            displayName={hittingStatMappings[key]?.label || key}
                                                            configurable={configurable}
                                                            selected={selectedHittingStats}
                                                            deselected={deselectedHittingStats}
                                                            onToggle={(key) => handleToggle(key, 'hitting')}
                                                        />
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {hittingStats.map((stat, index) => {
                                                const visibleStats = filterVisibleStats<HittingStats>(stat as HittingStats, selectedHittingStats);
                                                return (
                                                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                                        {getVisibleKeys(sortedHittingKeys, selectedHittingStats, deselectedHittingStats).map(key => (
                                                            <TableCell
                                                                key={key}
                                                                className="text-left whitespace-nowrap font-medium text-gray-700 py-2 px-2 first:pl-4 last:pr-4 text-sm"
                                                            >
                                                                {String(visibleStats[key as keyof HittingStats])}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {hasVisiblePitching && (
                    <TabsContent value="pitching">
                        <Card className="border-gray-100 shadow-sm">
                            <CardHeader className="border-b border-gray-100 bg-gray-50">
                                <CardTitle className="flex items-center justify-between text-mlb-blue">
                                    Pitching Statistics
                                    {configurable && (
                                        <SectionToggle
                                            title=""
                                            configurable={configurable}
                                            allKeys={sortedPitchingKeys}
                                            selectedKeys={selectedPitchingStats}
                                            onToggleAll={(keys) => handleToggleAll('pitching', keys)}
                                        />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 w-full">
                                <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                    <Table className="w-full table-auto">
                                        <TableHeader>
                                            <TableRow className="bg-gray-50 border-b border-gray-100">
                                                {getVisibleKeys(sortedPitchingKeys, selectedPitchingStats, deselectedPitchingStats).map((key) => (
                                                    <TableHead
                                                        key={key}
                                                        className="text-left whitespace-nowrap font-medium text-gray-600 py-2 px-2 first:pl-4 last:pr-4 text-xs"
                                                    >
                                                        <ConfigurableHeader
                                                            statKey={key}
                                                            displayName={pitchingStatMappings[key]?.label || key}
                                                            configurable={configurable}
                                                            selected={selectedPitchingStats}
                                                            deselected={deselectedPitchingStats}
                                                            onToggle={(key) => handleToggle(key, 'pitching')}
                                                        />
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pitchingStats.map((stat, index) => {
                                                const visibleStats = filterVisibleStats<PitchingStats>(stat as PitchingStats, selectedPitchingStats);
                                                return (
                                                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                                        {getVisibleKeys(sortedPitchingKeys, selectedPitchingStats, deselectedPitchingStats).map(key => (
                                                            <TableCell
                                                                key={key}
                                                                className="text-left whitespace-nowrap font-medium text-gray-700 py-2 px-2 first:pl-4 last:pr-4 text-sm"
                                                            >
                                                                {String(visibleStats[key as keyof PitchingStats])}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {!hasVisibleInfo && !hasVisibleHitting && !hasVisiblePitching && (
                <div className="text-center text-gray-500 py-8">
                    No stats selected to display
                </div>
            )}
        </div>
    );
};

export default PlayerStats; 
import React, { useEffect, useState } from 'react';
import { playerInfoMappings, hittingStatMappings, pitchingStatMappings, StatMapping } from '../utils/statMappings';
import { PlayerInfo, HittingStats, PitchingStats } from '../types/player';
import { ConfigurableHeader } from './ConfigurableHeader';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { ResponsiveTooltip } from "./ui/responsive-tooltip";

interface PlayerStatsProps {
    playerId: number;
    configurable?: boolean;
    selectedInfo: string[];
    deselectedInfo: string[];
    selectedHittingStats: string[];
    deselectedHittingStats: string[];
    selectedPitchingStats: string[];
    deselectedPitchingStats: string[];
    onStatsChange: (type: 'info' | 'hitting' | 'pitching', selected: string[], deselected: string[]) => void;
    showAllStats?: boolean;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
    playerId,
    configurable = false,
    selectedInfo,
    deselectedInfo,
    selectedHittingStats,
    deselectedHittingStats,
    selectedPitchingStats,
    deselectedPitchingStats,
    onStatsChange,
    showAllStats = false
}) => {
    const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
    const [hittingStats, setHittingStats] = useState<Partial<HittingStats>[]>([]);
    const [pitchingStats, setPitchingStats] = useState<Partial<PitchingStats>[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadPlayerData = async () => {
            if (!playerId) {
                setError("No player ID provided");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const data = await fetchPlayerData(playerId);

                if (!data.playerInfo) {
                    throw new Error("Player information not found");
                }

                setPlayerInfo(data.playerInfo as PlayerInfo);
                setHittingStats(data.hittingStats);
                setPitchingStats(data.pitchingStats);

                if (configurable) {
                    onStatsChange('info', [], Object.keys(data.playerInfo));

                    if (data.hittingStats.length > 0 && selectedHittingStats.length === 0) {
                        // Initialize with all available keys when no selection exists
                        const hittingKeys = Object.keys(data.hittingStats[0]);
                        onStatsChange('hitting', hittingKeys, []);
                    }

                    if (data.pitchingStats.length > 0 && selectedPitchingStats.length === 0) {
                        // Initialize with all available keys when no selection exists
                        const pitchingKeys = Object.keys(data.pitchingStats[0]);
                        onStatsChange('pitching', pitchingKeys, []);
                    }
                }
            } catch (error) {
                setError(error instanceof Error ? error.message : "Failed to load player data");
                console.error('Error loading player data:', error);
            } finally {
                setIsLoading(false);
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

            // If we're deselecting 'team', also deselect 'teamDetails'
            if (attribute === 'team') {
                // Add teamDetails to deselected if it's not already there
                if (!deselected.includes('teamDetails')) {
                    deselected.push('teamDetails');
                }
                // Remove teamDetails from selected if it's there
                selected = selected.filter(attr => attr !== 'teamDetails');
            }
        } else {
            deselected = deselected.filter(attr => attr !== attribute);
            selected.push(attribute);

            // If we're selecting 'team', also select 'teamDetails'
            if (attribute === 'team') {
                // Remove teamDetails from deselected if it's there
                deselected = deselected.filter(attr => attr !== 'teamDetails');
                // Add teamDetails to selected if it's not already there
                if (!selected.includes('teamDetails')) {
                    selected.push('teamDetails');
                }
            }
        }

        onStatsChange(type, selected, deselected);
    };

    const handleToggle = (key: string, type: 'info' | 'hitting' | 'pitching') => {
        // Remove special handling for awards - allow it to be toggled like any other field
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

            // If 'team' is selected, make sure 'teamDetails' is not in the deselected list
            if (selectedKeys.includes('team')) {
                deselectedKeys = deselectedKeys.filter(key => key !== 'teamDetails');
            }
        }

        onStatsChange(type, selectedKeys, deselectedKeys);
    };

    const filterVisibleStats = <T extends object>(stats: T, selectedKeys: string[]): Partial<T> => {
        if (configurable || showAllStats) {
            return stats;
        }

        // Only include keys that are in the selectedKeys array
        const filteredStats: Partial<T> = {};
        Object.keys(stats).forEach(key => {
            if (selectedKeys.includes(key)) {
                const k = key as keyof T;
                filteredStats[k] = stats[k];
            }

            // Always include teamDetails if team is selected
            if (key === 'teamDetails' && selectedKeys.includes('team')) {
                const k = key as keyof T;
                filteredStats[k] = stats[k];
            }
        });

        return filteredStats;
    };

    const getSortedKeys = <T extends Record<string, any>>(obj: T, mappings: Record<string, StatMapping>): (keyof T)[] => {
        // Get all keys that exist in the mappings
        const mappedKeys = (Object.keys(obj) as (keyof T)[])
            .filter(key => key in mappings)
            .sort((a, b) => (mappings[String(a)]?.order || 0) - (mappings[String(b)]?.order || 0));

        return mappedKeys;
    };

    const getVisibleKeys = (allKeys: string[], selected: string[], deselected: string[]) => {
        // When configurable is true or showAllStats is true, show all columns
        if (configurable || showAllStats) {
            // Filter out teamDetails as it should only be used in conjunction with team
            return allKeys.filter(key => key !== 'teamDetails');
        }

        // Only show keys that are in the selected array, but never include teamDetails
        return allKeys.filter(key => selected.includes(key) && key !== 'teamDetails');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mlb-blue mx-auto"></div>
                    <p className="text-gray-600">Loading player statistics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] bg-white rounded-lg border border-red-200">
                <div className="text-center text-red-600">
                    <p>Error loading player statistics: {error}</p>
                </div>
            </div>
        );
    }

    if (!playerInfo) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mlb-blue"></div>
        </div>
    );

    const visiblePlayerInfo = filterVisibleStats(playerInfo, selectedInfo);
    const hasVisibleInfo = configurable || showAllStats || selectedInfo.length > 0;
    const hasVisibleHitting = configurable || showAllStats || selectedHittingStats.length > 0;
    const hasVisiblePitching = configurable || showAllStats || selectedPitchingStats.length > 0;

    const sortedInfoKeys = getSortedKeys(visiblePlayerInfo, playerInfoMappings);
    const sortedHittingKeys = hittingStats.length > 0 ? getSortedKeys(hittingStats[0], hittingStatMappings) : [];
    const sortedPitchingKeys = pitchingStats.length > 0 ? getSortedKeys(pitchingStats[0], pitchingStatMappings) : [];

    return (
        <div className="max-w-7xl mx-auto px-4 py-6 bg-white" data-testid="player-stats">
            {/* Player Header */}
            <div className="space-y-6 mb-8">
                <div className="flex gap-6">
                    <div className="shrink-0">
                        <Avatar className="h-32 w-32 rounded-lg border-2 border-gray-100 shadow-sm">
                            <AvatarImage src={configurable === true || showAllStats === true ? playerInfo.imageUrl : 'https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/1/headshot/67/current'} alt={configurable === true || showAllStats === true ? playerInfo.fullName : 'Player'} />
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
                            {getVisibleKeys(sortedInfoKeys, selectedInfo, deselectedInfo).map((key) => {
                                const value = visiblePlayerInfo[key as keyof typeof visiblePlayerInfo];
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
            <Tabs defaultValue={hasVisibleHitting ? "hitting" : hasVisiblePitching ? "pitching" : undefined} className="w-full">
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
                            <CardHeader className="border-b border-gray-100 bg-gray-50 pb-4">
                                <CardTitle className="flex items-center justify-between text-mlb-blue">
                                    Hitting Statistics
                                    {configurable && (
                                        <SectionToggle
                                            title=""
                                            configurable={configurable}
                                            allKeys={sortedHittingKeys}
                                            selectedKeys={selectedHittingStats}
                                            onToggleAll={(keys) => {
                                                handleToggleAll('hitting', keys);
                                            }}
                                        />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 pt-4 w-full">
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
                                                const visibleKeys = getVisibleKeys(sortedHittingKeys, selectedHittingStats, deselectedHittingStats);
                                                return (
                                                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                                        {visibleKeys.map(key => (
                                                            <TableCell
                                                                key={key}
                                                                className={`text-left whitespace-nowrap font-medium py-2 px-2 first:pl-4 last:pr-4 text-sm ${key === 'awards'
                                                                    ? 'text-mlb-blue font-bold'
                                                                    : 'text-gray-700'
                                                                    }`}
                                                            >
                                                                {key === 'team' && visibleStats.teamDetails && visibleStats.teamDetails !== visibleStats.team ? (
                                                                    <ResponsiveTooltip
                                                                        content={<p>{visibleStats.teamDetails}</p>}
                                                                        side="top"
                                                                        contentClassName="bg-white border border-gray-200 shadow-md"
                                                                    >
                                                                        <span className="underline decoration-dotted cursor-help">
                                                                            {String(visibleStats[key as keyof typeof visibleStats] || '')}
                                                                        </span>
                                                                    </ResponsiveTooltip>
                                                                ) : (
                                                                    visibleStats[key as keyof typeof visibleStats] === 0 ? "0" : String(visibleStats[key as keyof typeof visibleStats] || '')
                                                                )}
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
                            <CardHeader className="border-b border-gray-100 bg-gray-50 pb-4">
                                <CardTitle className="flex items-center justify-between text-mlb-blue">
                                    Pitching Statistics
                                    {configurable && (
                                        <SectionToggle
                                            title=""
                                            configurable={configurable}
                                            allKeys={sortedPitchingKeys}
                                            selectedKeys={selectedPitchingStats}
                                            onToggleAll={(keys) => {
                                                handleToggleAll('pitching', keys);
                                            }}
                                        />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 pt-4 w-full">
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
                                                const visibleKeys = getVisibleKeys(sortedPitchingKeys, selectedPitchingStats, deselectedPitchingStats);
                                                return (
                                                    <TableRow key={index} className="hover:bg-gray-50 border-b border-gray-100">
                                                        {visibleKeys.map(key => (
                                                            <TableCell
                                                                key={key}
                                                                className={`text-left whitespace-nowrap font-medium py-2 px-2 first:pl-4 last:pr-4 text-sm ${key === 'awards'
                                                                    ? 'text-mlb-blue font-bold'
                                                                    : 'text-gray-700'
                                                                    }`}
                                                            >
                                                                {key === 'team' && visibleStats.teamDetails && visibleStats.teamDetails !== visibleStats.team ? (
                                                                    <ResponsiveTooltip
                                                                        content={<p>{visibleStats.teamDetails}</p>}
                                                                        side="top"
                                                                        contentClassName="bg-white border border-gray-200 shadow-md"
                                                                    >
                                                                        <span className="underline decoration-dotted cursor-help">
                                                                            {String(visibleStats[key as keyof typeof visibleStats] || '')}
                                                                        </span>
                                                                    </ResponsiveTooltip>
                                                                ) : (
                                                                    visibleStats[key as keyof typeof visibleStats] === 0 ? "0" : String(visibleStats[key as keyof typeof visibleStats] || '')
                                                                )}
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
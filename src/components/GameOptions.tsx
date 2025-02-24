import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import {
    FormControl,
    FormDescription,
    FormItem,
    FormLabel,
} from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Switch } from "../components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { OrderedStatsList } from "./OrderedStatsList";
import { playerInfoMappings, hittingStatMappings, pitchingStatMappings } from '../utils/statMappings';

export interface GameOptions {
    maxGuesses: number;
    hint?: {
        enabled: boolean;
        text: string;
    };
    progressiveReveal?: {
        enabled: boolean;
        statsPerReveal: number;
        // Stats that should never be revealed during the game
        protectedStats: string[];
        // Stats that should be revealed in a specific order
        orderedStats: {
            info?: string[];
            hitting?: string[];
            pitching?: string[];
        };
        // Whether to use ordered reveal (if false, falls back to random)
        useOrderedReveal: boolean;
    };
}

interface GameOptionsProps {
    options: GameOptions;
    onOptionsChange: (options: GameOptions) => void;
    deselectedStats: {
        info: string[];
        hitting: string[];
        pitching: string[];
    };
}

export const GameOptions: React.FC<GameOptionsProps> = ({
    options,
    onOptionsChange,
    deselectedStats
}) => {
    const handleMaxGuessesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        onOptionsChange({
            ...options,
            maxGuesses: isNaN(value) ? 3 : value,
        });
    };

    const handleHintToggle = (checked: boolean) => {
        onOptionsChange({
            ...options,
            hint: {
                enabled: checked,
                text: options.hint?.text || ''
            }
        });
    };

    const handleHintTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onOptionsChange({
            ...options,
            hint: {
                enabled: options.hint?.enabled || false,
                text: e.target.value
            }
        });
    };

    const handleProgressiveRevealToggle = (checked: boolean) => {
        onOptionsChange({
            ...options,
            progressiveReveal: {
                enabled: checked,
                statsPerReveal: options.progressiveReveal?.statsPerReveal || 1,
                protectedStats: options.progressiveReveal?.protectedStats || [
                    'fullName',
                    'imageUrl',
                    'currentTeam',
                    'firstName',
                    'lastName',
                    'middleName',
                    'useFirstName',
                    'useLastName',
                    'useMiddleName',
                    'nickName'
                ],
                orderedStats: options.progressiveReveal?.orderedStats || {
                    info: [],
                    hitting: [],
                    pitching: []
                },
                useOrderedReveal: options.progressiveReveal?.useOrderedReveal || false
            }
        });
    };

    const handleStatsPerRevealChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        onOptionsChange({
            ...options,
            progressiveReveal: {
                ...options.progressiveReveal!,
                statsPerReveal: isNaN(value) ? 1 : value
            }
        });
    };

    const handleOrderedStatsChange = (
        type: 'info' | 'hitting' | 'pitching',
        newOrder: string[]
    ) => {
        onOptionsChange({
            ...options,
            progressiveReveal: {
                ...options.progressiveReveal!,
                orderedStats: {
                    ...options.progressiveReveal?.orderedStats,
                    [type]: newOrder
                }
            }
        });
    };

    const handleUseOrderedRevealToggle = (checked: boolean) => {
        onOptionsChange({
            ...options,
            progressiveReveal: {
                ...options.progressiveReveal!,
                useOrderedReveal: checked,
                // If enabling ordered reveal, use current deselected stats as the initial order
                ...(checked && {
                    orderedStats: {
                        info: deselectedStats.info,
                        hitting: deselectedStats.hitting,
                        pitching: deselectedStats.pitching
                    }
                })
            }
        });
    };

    // Convert stat mappings to format needed by OrderedStatsList, but only for deselected stats
    const getAvailableStats = (mappings: Record<string, { label: string }>, deselectedKeys: string[]) =>
        Object.entries(mappings)
            .filter(([key]) =>
                !options.progressiveReveal?.protectedStats.includes(key) &&
                deselectedKeys.includes(key)
            )
            .map(([key, value]) => ({
                id: key,
                label: value.label
            }));

    return (
        <div className="space-y-6">
            <FormItem>
                <FormLabel>Maximum Guesses</FormLabel>
                <FormControl>
                    <Input
                        type="number"
                        min={0}
                        max={10}
                        value={options.maxGuesses}
                        onChange={handleMaxGuessesChange}
                    />
                </FormControl>
                <FormDescription>
                    Number of guesses allowed before the game is over (0 for unlimited, max 10)
                </FormDescription>
            </FormItem>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <FormLabel className="!mt-0">Enable Hint</FormLabel>
                    <Switch
                        checked={options.hint?.enabled || false}
                        onCheckedChange={handleHintToggle}
                        className="data-[state=checked]:bg-mlb-blue data-[state=unchecked]:bg-gray-200 
                            data-[state=checked]:hover:bg-mlb-blue/90
                            transition-colors
                            [&>span]:data-[state=checked]:bg-white
                            [&>span]:data-[state=unchecked]:bg-white
                            [&>span]:shadow-sm"
                    />
                </div>
                {options.hint?.enabled && (
                    <FormItem>
                        <FormControl>
                            <Textarea
                                placeholder="Enter a hint that players can reveal if they're stuck..."
                                value={options.hint?.text || ''}
                                onChange={handleHintTextChange}
                                className="resize-none"
                                rows={3}
                            />
                        </FormControl>
                        <FormDescription>
                            Players can reveal this hint during the game
                        </FormDescription>
                    </FormItem>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <FormLabel className="!mt-0">Enable Progressive Stat Reveal</FormLabel>
                    <Switch
                        checked={options.progressiveReveal?.enabled || false}
                        onCheckedChange={handleProgressiveRevealToggle}
                        className="data-[state=checked]:bg-mlb-blue data-[state=unchecked]:bg-gray-200 
                            data-[state=checked]:hover:bg-mlb-blue/90
                            transition-colors
                            [&>span]:data-[state=checked]:bg-white
                            [&>span]:data-[state=unchecked]:bg-white
                            [&>span]:shadow-sm"
                    />
                </div>
                {options.progressiveReveal?.enabled && (
                    <div className="space-y-4">
                        <FormItem>
                            <FormLabel>Stats Per Reveal</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={options.progressiveReveal?.statsPerReveal || 1}
                                    onChange={handleStatsPerRevealChange}
                                />
                            </FormControl>
                            <FormDescription>
                                Number of additional stats to reveal after each wrong guess or manual reveal (1-5)
                            </FormDescription>
                        </FormItem>

                        <FormItem>
                            <div className="flex items-center justify-between mb-4">
                                <FormLabel className="!mt-0">Use Ordered Reveal</FormLabel>
                                <Switch
                                    checked={options.progressiveReveal?.useOrderedReveal || false}
                                    onCheckedChange={handleUseOrderedRevealToggle}
                                    className="data-[state=checked]:bg-mlb-blue data-[state=unchecked]:bg-gray-200 
                                        data-[state=checked]:hover:bg-mlb-blue/90
                                        transition-colors
                                        [&>span]:data-[state=checked]:bg-white
                                        [&>span]:data-[state=unchecked]:bg-white
                                        [&>span]:shadow-sm"
                                />
                            </div>
                            <FormDescription>
                                When enabled, stats will be revealed in the specified order. When disabled, stats will be revealed randomly.
                            </FormDescription>
                        </FormItem>

                        {options.progressiveReveal?.useOrderedReveal && (
                            <div className="pt-4 border-t border-gray-100">
                                <FormLabel>Configure Stat Reveal Order</FormLabel>
                                <FormDescription className="mb-4">
                                    Drag to reorder stats and toggle to include/exclude them from the reveal order.
                                    Only deselected stats are shown here, as selected stats will be visible immediately.
                                </FormDescription>
                                <Tabs defaultValue="info" className="w-full">
                                    <TabsList className="w-full grid grid-cols-3">
                                        <TabsTrigger value="info">Player Info</TabsTrigger>
                                        <TabsTrigger value="hitting">Hitting</TabsTrigger>
                                        <TabsTrigger value="pitching">Pitching</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="info" className="mt-4">
                                        <OrderedStatsList
                                            title="Player Information Stats"
                                            availableStats={getAvailableStats(playerInfoMappings, deselectedStats.info)}
                                            selectedStats={options.progressiveReveal?.orderedStats?.info || []}
                                            onOrderChange={(newOrder) => handleOrderedStatsChange('info', newOrder)}
                                        />
                                    </TabsContent>
                                    <TabsContent value="hitting" className="mt-4">
                                        <OrderedStatsList
                                            title="Hitting Stats"
                                            availableStats={getAvailableStats(hittingStatMappings, deselectedStats.hitting)}
                                            selectedStats={options.progressiveReveal?.orderedStats?.hitting || []}
                                            onOrderChange={(newOrder) => handleOrderedStatsChange('hitting', newOrder)}
                                        />
                                    </TabsContent>
                                    <TabsContent value="pitching" className="mt-4">
                                        <OrderedStatsList
                                            title="Pitching Stats"
                                            availableStats={getAvailableStats(pitchingStatMappings, deselectedStats.pitching)}
                                            selectedStats={options.progressiveReveal?.orderedStats?.pitching || []}
                                            onOrderChange={(newOrder) => handleOrderedStatsChange('pitching', newOrder)}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}; 
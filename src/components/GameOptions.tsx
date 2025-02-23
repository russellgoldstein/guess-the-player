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

export interface GameOptions {
    maxGuesses: number;
    hint?: {
        enabled: boolean;
        text: string;
    };
}

interface GameOptionsProps {
    options: GameOptions;
    onOptionsChange: (options: GameOptions) => void;
}

export const GameOptions: React.FC<GameOptionsProps> = ({
    options,
    onOptionsChange,
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

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Game Options</CardTitle>
                <CardDescription>Configure how the game will be played</CardDescription>
            </CardHeader>
            <CardContent>
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
                </div>
            </CardContent>
        </Card>
    );
}; 
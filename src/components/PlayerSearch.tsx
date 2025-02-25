import React, { useState, useRef, useEffect } from 'react';
import { Command } from "cmdk";
import { MLB_API_BASE_URL } from '../utils/mlbApi';
import { Player } from '../types/player';
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

interface PlayerSearchProps {
    onPlayerSelect: (player: Player) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ onPlayerSelect }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const commandRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const searchPlayers = async (query: string) => {
        if (query.length < 2) {
            setPlayers([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${MLB_API_BASE_URL}/people/search?names=${encodeURIComponent(query)}`);
            const data = await response.json();
            setPlayers((data.people || []).slice(0, 5)); // Limit to 5 players
            setOpen(true);
        } catch (error) {
            console.error('Error searching players:', error);
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        if (value.length >= 2) {
            searchPlayers(value);
        } else {
            setOpen(false);
        }
    };

    const handleSelect = (playerId: number, playerName: string) => {
        setOpen(false);
        setSearch(playerName);
        onPlayerSelect({ id: playerId, fullName: playerName });
    };

    return (
        <div className="relative">
            <Command
                ref={commandRef}
                className="border border-gray-200 rounded-lg shadow-sm bg-white"
                loop
                shouldFilter={false}
            >
                <div className="flex items-center p-2">
                    <input
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => search.length >= 2 && setOpen(true)}
                        className="w-full px-2 py-1 outline-none"
                        placeholder="Search for a player..."
                        role="combobox"
                        aria-expanded={open}
                        aria-controls="player-search-listbox"
                        aria-autocomplete="list"
                        data-testid="player-search-input"
                    />
                </div>

                {open && (
                    <div
                        id="player-search-listbox"
                        role="listbox"
                        className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] max-h-[300px] overflow-y-auto"
                    >
                        {loading && (
                            <div className="p-4 text-center text-gray-500">
                                Loading...
                            </div>
                        )}
                        {!loading && players.length > 0 && (
                            <>
                                {players.map((player) => (
                                    <div
                                        key={player.id}
                                        role="option"
                                        aria-selected={search === player.fullName}
                                        onClick={() => handleSelect(player.id, player.fullName)}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                        data-testid={`player-option-${player.id}`}
                                    >
                                        <Avatar className="h-8 w-8 rounded-full border border-gray-100">
                                            <AvatarImage
                                                src={`https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${player.id}/headshot/67/current`}
                                                alt={player.fullName}
                                            />
                                            <AvatarFallback className="text-sm bg-mlb-blue text-white">
                                                {player.fullName?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="flex-1">{player.fullName}</span>
                                    </div>
                                ))}
                            </>
                        )}
                        {!loading && search.length >= 2 && players.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                                No players found
                            </div>
                        )}
                    </div>
                )}
            </Command>
        </div>
    );
}; 
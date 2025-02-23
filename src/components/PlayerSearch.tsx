import React, { useState } from 'react';
import { Command } from "cmdk";
import { MLB_API_BASE_URL } from '../utils/mlbApi';
import { Player } from '../types/player';

interface PlayerSearchProps {
    onPlayerSelect: (player: Player) => void;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({ onPlayerSelect }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);

    const searchPlayers = async (query: string) => {
        if (query.length < 2) {
            setPlayers([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${MLB_API_BASE_URL}/people/search?names=${encodeURIComponent(query)}`);
            const data = await response.json();
            setPlayers(data.people || []);
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
                className="border border-gray-200 rounded-lg shadow-sm"
                loop
                shouldFilter={false}
            >
                <div className="flex items-center border-b p-2">
                    <input
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={() => search.length >= 2 && setOpen(true)}
                        className="w-full px-2 py-1 outline-none"
                        placeholder="Search for a player..."
                    />
                </div>
                {open && (
                    <>
                        {loading && (
                            <div className="p-4 text-center text-gray-500">
                                Loading...
                            </div>
                        )}
                        {!loading && players.length > 0 && (
                            <Command.List className="max-h-[300px] overflow-y-auto">
                                {players.map((player) => (
                                    <Command.Item
                                        key={player.id}
                                        value={player.fullName}
                                        onSelect={() => handleSelect(player.id, player.fullName)}
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {player.fullName}
                                    </Command.Item>
                                ))}
                            </Command.List>
                        )}
                        {!loading && search.length >= 2 && players.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                                No players found
                            </div>
                        )}
                    </>
                )}
            </Command>
        </div>
    );
}; 
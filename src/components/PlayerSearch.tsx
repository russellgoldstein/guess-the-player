import React, { useState, useEffect } from 'react';
import { AutoComplete, type Option } from '@/components/ui/autocomplete';

interface Player {
    id: number;
    fullName: string;
}

interface PlayerSearchProps {
    onPlayerSelect: (playerId: number) => void;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({ onPlayerSelect }) => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            if (inputValue.length < 3) return; // Fetch only if input is 3 or more characters
            setIsLoading(true);
            const response = await fetch(`https://statsapi.mlb.com/api/v1/people/search?names=${inputValue}`);
            const data = await response.json();
            setPlayers(data.people);
            setIsLoading(false);
        };

        fetchPlayers();
    }, [inputValue]);

    const options: Option[] = players.map(player => ({
        value: player.id.toString(),
        label: player.fullName
    }));

    const handleValueChange = (selectedOption: Option) => {
        console.log(selectedOption);
        onPlayerSelect(Number(selectedOption.value));
    };

    return (
        <AutoComplete
            options={options}
            emptyMessage="No players found."
            placeholder="Search for a player"
            isLoading={isLoading}
            onValueChange={handleValueChange}
            inputValue={inputValue}
            setInputValue={setInputValue}
        />
    );
};

export default PlayerSearch; 
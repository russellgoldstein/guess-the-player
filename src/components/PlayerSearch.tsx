import React, { useState } from 'react';
import { useCombobox } from 'downshift';

const players = [
    // Example player data
    { name: 'Babe Ruth', id: '1' },
    { name: 'Hank Aaron', id: '2' },
    { name: 'Willie Mays', id: '3' },
];

interface Player {
    id: string;
    name: string;
}

interface PlayerSearchProps {
    onPlayerSelect: (player: Player) => void;
}

const PlayerSearch: React.FC<PlayerSearchProps> = ({ onPlayerSelect }) => {
    const {
        isOpen,
        getMenuProps,
        getInputProps,
        getItemProps,
        highlightedIndex,
    } = useCombobox({
        items: players,
        itemToString: (item) => (item ? item.name : ''),
        onSelectedItemChange: ({ selectedItem }) => {
            if (selectedItem) {
                onPlayerSelect(selectedItem);
            }
        },
    });

    return (
        <div>
            <input {...getInputProps()} placeholder="Search for a player" />
            <ul {...getMenuProps()}>
                {isOpen &&
                    players.map((player, index) => {
                        const itemProps = getItemProps({ index, item: player });
                        return (
                            <li
                                key={player.id}
                                {...itemProps}
                                style={{
                                    backgroundColor: highlightedIndex === index ? '#bde4ff' : 'white',
                                }}
                            >
                                {player.name}
                            </li>
                        );
                    })}
            </ul>
        </div>
    );
};

export default PlayerSearch; 
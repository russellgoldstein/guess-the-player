import React from 'react';

interface SectionToggleProps {
    title: string;
    configurable: boolean;
    allKeys: string[];
    selectedKeys: string[];
    onToggleAll: (keys: string[]) => void;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
    title,
    configurable,
    allKeys,
    selectedKeys,
    onToggleAll,
}) => {
    if (!configurable) return <h3 className="text-xl font-semibold mb-2">{title}</h3>;

    const isAllSelected = allKeys.length === selectedKeys.length;

    const handleToggle = () => {
        if (isAllSelected) {
            // If all are selected, deselect all
            onToggleAll([]);
        } else {
            // If some or none are selected, select all
            onToggleAll(allKeys);
        }
    };

    return (
        <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
                onClick={handleToggle}
                className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200 transition-colors"
            >
                {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>
        </div>
    );
}; 
interface ConfigurableTextProps {
    itemKey: string;
    displayName: string;
    value: string;
    configurable: boolean;
    selected: string[];
    deselected: string[];
    onToggle: (key: string) => void;
}

export const ConfigurableText: React.FC<ConfigurableTextProps> = ({
    itemKey,
    displayName,
    value,
    configurable,
    selected,
    deselected,
    onToggle
}) => {
    const getClassName = () => {
        if (!configurable) return '';

        if (selected.includes(itemKey)) {
            return 'text-green-500 cursor-pointer';
        }
        if (deselected.includes(itemKey)) {
            return 'text-red-500 cursor-pointer';
        }
        return '';
    };

    return (
        <p
            className={getClassName()}
            onClick={() => configurable && onToggle(itemKey)}
        >
            <strong>{displayName}:</strong> {value}
        </p>
    );
}; 
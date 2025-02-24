import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
    id: string;
    label: string;
    isSelected: boolean;
    onToggle: () => void;
}

const SortableItem = ({ id, label, isSelected, onToggle }: SortableItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-white rounded-lg border ${isDragging ? 'border-blue-300 shadow-lg' : 'border-gray-200'}`}
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab hover:text-blue-600 touch-none"
                aria-label="Reorder stat"
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm">{label}</span>
            <Switch
                checked={isSelected}
                onCheckedChange={onToggle}
                className="data-[state=checked]:bg-mlb-blue data-[state=unchecked]:bg-gray-200 
                    data-[state=checked]:hover:bg-mlb-blue/90
                    transition-colors
                    [&>span]:data-[state=checked]:bg-white
                    [&>span]:data-[state=unchecked]:bg-white
                    [&>span]:shadow-sm"
            />
        </div>
    );
};

interface OrderedStatsListProps {
    title: string;
    availableStats: { id: string; label: string }[];
    selectedStats: string[];
    onOrderChange: (newOrder: string[]) => void;
}

export const OrderedStatsList = ({
    title,
    availableStats,
    selectedStats,
    onOrderChange,
}: OrderedStatsListProps) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = selectedStats.indexOf(String(active.id));
            const newIndex = selectedStats.indexOf(String(over.id));
            onOrderChange(arrayMove(selectedStats, oldIndex, newIndex));
        }
    };

    const handleToggle = (statId: string) => {
        if (selectedStats.includes(statId)) {
            onOrderChange(selectedStats.filter(id => id !== statId));
        } else {
            onOrderChange([...selectedStats, statId]);
        }
    };

    const sortedStats = [
        // First, show selected stats in their ordered position
        ...selectedStats
            .map(id => availableStats.find(stat => stat.id === id))
            .filter((stat): stat is { id: string; label: string } => stat !== undefined),
        // Then, show unselected stats
        ...availableStats.filter(stat => !selectedStats.includes(stat.id))
    ];

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">{title}</h3>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOrderChange(availableStats.map(stat => stat.id))}
                    >
                        Select All
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOrderChange([])}
                    >
                        Clear All
                    </Button>
                </div>
            </div>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={sortedStats.map(stat => stat.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {sortedStats.map((stat) => (
                            <SortableItem
                                key={stat.id}
                                id={stat.id}
                                label={stat.label}
                                isSelected={selectedStats.includes(stat.id)}
                                onToggle={() => handleToggle(stat.id)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}; 
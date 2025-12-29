'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    getInterestsAction,
    addChannelAction,
    removeChannelAction,
    addCategoryAction,
    removeCategoryAction,
    renameCategoryAction,
    updateCategoriesStateAction,
    searchChannelsAction
} from '../actions';
import { Channel, UserInterests, Category } from '../lib/types';
import { Home, Search, Plus, X, Tv, Trash2, GripVertical, FolderPlus, Edit2, Check } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    useDroppable
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Channel Item Component ---
function SortableChannelItem({ channel, isActive, onRemove, isOverlay }: { channel: Channel, isActive: boolean, onRemove: (e: React.MouseEvent) => void, isOverlay?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: channel.id, data: { type: 'CHANNEL', channel } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <li ref={setNodeRef} style={style} className={`text-sm group rounded-lg overflow-hidden transition-all ${isOverlay ? 'shadow-2xl scale-105 z-50 bg-neutral-900 border border-green-500/30' : ''}`}>
            <Link
                href={`/?channelId=${channel.id}`}
                className={`flex items-center justify-between px-3 py-2 w-full rounded-lg transition-all ${isActive
                    ? 'bg-gradient-to-r from-green-500/10 via-yellow-500/8 to-lime-500/8 text-green-600 border border-green-300/30 dark:from-green-500/15 dark:via-yellow-500/12 dark:to-lime-500/12 dark:text-green-300 dark:border-green-500/25 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-gradient-to-r hover:from-green-500/5 hover:via-yellow-500/3 hover:to-lime-500/5 dark:hover:from-green-500/5 dark:hover:via-yellow-500/3 dark:hover:to-lime-500/5 hover:text-neutral-900 dark:hover:text-white'
                    }`}
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 flex-shrink-0 touch-none">
                        <GripVertical size={14} />
                    </div>
                    {channel.thumbnail ? (
                        <img src={channel.thumbnail} alt="" className="w-6 h-6 rounded-full ring-1 ring-white/10 flex-shrink-0" />
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 flex-shrink-0">
                            <Tv size={12} />
                        </div>
                    )}
                    <span className="truncate">{channel.title}</span>
                </div>
                <button
                    onClick={onRemove}
                    className="text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-neutral-200 dark:hover:bg-white/5 rounded flex-shrink-0 ml-2"
                    aria-label="Remove channel"
                >
                    <X size={14} />
                </button>
            </Link>
        </li>
    );
}

// --- Category Droppable & Sortable List ---
function CategoryList({
    category,
    allChannelsMap,
    currentChannelId,
    editingCategoryId,
    editCategoryName,
    setEditCategoryName,
    handleRemoveChannel,
    saveCategoryRename,
    startEditingCategory,
    handleDeleteCategory
}: {
    category: Category,
    allChannelsMap: Map<string, Channel>,
    currentChannelId: string | null,
    editingCategoryId: string | null,
    editCategoryName: string,
    setEditCategoryName: (s: string) => void,
    handleRemoveChannel: (e: React.MouseEvent, id: string) => void,
    saveCategoryRename: (id: string) => void,
    startEditingCategory: (id: string, name: string) => void,
    handleDeleteCategory: (e: React.MouseEvent, id: string) => void
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: category.id,
        data: { type: 'CATEGORY', category }
    });

    return (
        <div className="flex flex-col gap-1">
            {/* Category Header */}
            {category.id !== 'uncategorized' && (
                <div className="group flex items-center justify-between px-2 py-1 text-neutral-400 hover:text-green-400/70 transition-colors">
                    {editingCategoryId === category.id ? (
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                autoFocus
                                type="text"
                                className="bg-gradient-to-r from-green-900/40 to-yellow-900/40 text-white text-xs px-1 rounded w-full border border-green-500/30 focus:border-green-400/60 focus:ring-1 focus:ring-green-400/30"
                                value={editCategoryName}
                                onChange={e => setEditCategoryName(e.target.value)}
                                onBlur={() => saveCategoryRename(category.id)}
                                onKeyDown={e => e.key === 'Enter' && saveCategoryRename(category.id)}
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase flex-1">
                            <span className="text-neutral-600 dark:bg-gradient-to-r dark:from-green-300 dark:to-yellow-300 dark:bg-clip-text dark:text-transparent" onDoubleClick={() => startEditingCategory(category.id, category.name)}>{category.name}</span>
                            <button onClick={() => startEditingCategory(category.id, category.name)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 transition-opacity">
                                <Edit2 size={10} />
                            </button>
                        </div>
                    )}

                    {category.channelIds.length === 0 && (
                        <button onClick={(e) => handleDeleteCategory(e, category.id)} className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-500">
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            )}

            {/* Droppable Area */}
            <SortableContext
                id={category.id}
                items={category.channelIds}
                strategy={verticalListSortingStrategy}
            >
                <ul
                    ref={setNodeRef}
                    className={`space-y-0.5 min-h-[10px] rounded-lg p-1 transition-all border ${isOver
                        ? 'bg-gradient-to-br from-green-500/10 via-yellow-500/8 to-lime-500/8 border-green-500/30 dark:from-green-500/15 dark:via-yellow-500/12 dark:to-lime-500/12 dark:border-green-500/25 shadow-sm'
                        : 'border-transparent'
                        }`}
                >
                    {category.channelIds.map(channelId => {
                        const channel = allChannelsMap.get(channelId);
                        if (!channel) return null;
                        return (
                            <SortableChannelItem
                                key={channel.id}
                                channel={channel}
                                isActive={currentChannelId === channel.id}
                                onRemove={(e) => handleRemoveChannel(e, channel.id)}
                            />
                        );
                    })}
                </ul>
            </SortableContext>
        </div>
    );
}

export default function InterestManager() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const currentChannelId = searchParams.get('channelId');
    const isHome = !currentChannelId;

    const [interests, setInterests] = useState<UserInterests | null>(null);
    const [channelQuery, setChannelQuery] = useState('');
    const [channelResults, setChannelResults] = useState<Channel[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Category management state
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');

    // Loading states
    const [addingChannelId, setAddingChannelId] = useState<string | null>(null);

    // Dragging state
    const [activeDragChannel, setActiveDragChannel] = useState<Channel | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        // Fetch initial data
        getInterestsAction().then(setInterests);
    }, []);

    const refreshData = async () => {
        const updated = await getInterestsAction();
        setInterests(updated);
        router.refresh();
    };

    // --- Search & Add Actions ---

    const handleSearchChannels = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channelQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchChannelsAction(channelQuery);
            setChannelResults(results);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddChannel = async (channel: Channel) => {
        setAddingChannelId(channel.id);
        try {
            await addChannelAction(channel);
            // Optimistic update - clear search
            setChannelResults([]);
            setChannelQuery('');
            refreshData();
        } finally {
            setAddingChannelId(null);
        }
    };

    const handleRemoveChannel = async (e: React.MouseEvent, id: string) => {
        e.preventDefault(); e.stopPropagation();
        await removeChannelAction(id);
        if (currentChannelId === id) router.push('/');
        refreshData();
    };

    // --- Category Actions ---

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            await addCategoryAction(newCategoryName);
            setNewCategoryName('');
            setIsAddingCategory(false);
            refreshData();
        }
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        if (confirm("Delete this category? Channels will be moved to 'Channels'.")) {
            await removeCategoryAction(id);
            refreshData();
        }
    };

    const startEditingCategory = (id: string, currentName: string) => {
        setEditingCategoryId(id);
        setEditCategoryName(currentName);
    };

    const saveCategoryRename = async (id: string) => {
        if (editCategoryName.trim()) {
            await renameCategoryAction(id, editCategoryName);
        }
        setEditingCategoryId(null);
        refreshData();
    };

    // --- Drag and Drop Logic ---

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const channel = interests?.channels.find(c => c.id === active.id);
        if (channel) setActiveDragChannel(channel);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over || !interests) return;

        // Visual only update
        const findContainer = (id: string) => {
            if (interests.categories.find(c => c.id === id)) return id;
            return interests.categories.find(cat => cat.channelIds.includes(id))?.id;
        };

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            return;
        }

        const activeCategory = interests.categories.find(c => c.id === activeContainer);
        const overCategory = interests.categories.find(c => c.id === overContainer);

        if (activeCategory && overCategory) {
            const newCategories = interests.categories.map(cat => {
                if (cat.id === activeContainer) {
                    return { ...cat, channelIds: cat.channelIds.filter(id => id !== active.id) };
                }
                if (cat.id === overContainer) {
                    if (!cat.channelIds.includes(active.id as string)) {
                        return { ...cat, channelIds: [...cat.channelIds, active.id as string] };
                    }
                }
                return cat;
            });
            // Optimistic sync
            setInterests({ ...interests, categories: newCategories });
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragChannel(null);

        if (!over || !interests) return;

        const findContainer = (id: string) => {
            if (interests.categories.find(c => c.id === id)) return id;
            return interests.categories.find(cat => cat.channelIds.includes(id))?.id;
        };

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(over.id as string);

        if (activeContainer && overContainer) {
            let newCategories = interests.categories.map(c => ({ ...c, channelIds: [...c.channelIds] }));

            // 1. Remove from source
            newCategories = newCategories.map(c => {
                if (c.id === activeContainer) {
                    return { ...c, channelIds: c.channelIds.filter(id => id !== active.id) };
                }
                return c;
            });

            // 2. Add to dest
            const destCat = newCategories.find(c => c.id === overContainer);
            if (destCat) {
                if (!destCat.channelIds.includes(active.id as string)) {
                    // Added to container, check where
                    const overIsItem = interests.channels.find(c => c.id === over.id);
                    if (overIsItem) {
                        const atIndex = destCat.channelIds.indexOf(over.id as string);
                        if (atIndex >= 0) {
                            destCat.channelIds.splice(atIndex, 0, active.id as string);
                        } else {
                            destCat.channelIds.push(active.id as string);
                        }
                    } else {
                        // Dropped on container
                        destCat.channelIds.push(active.id as string);
                    }
                } else {
                    // Already in container, reordering
                    if (activeContainer === overContainer) {
                        const oldIndex = interests.categories.find(c => c.id === activeContainer)?.channelIds.indexOf(active.id as string) ?? -1;
                        const newIndex = destCat.channelIds.indexOf(over.id as string);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            destCat.channelIds = arrayMove(destCat.channelIds, oldIndex, newIndex);
                        }
                    }
                }
            }

            // Optimistic update
            setInterests({ ...interests, categories: newCategories });
            // Server sync
            await updateCategoriesStateAction(newCategories);
        }
    };


    if (!interests) return <div className="p-4 text-neutral-500 animate-pulse">Loading...</div>;

    const allChannelsMap = new Map(interests.channels.map(c => [c.id, c]));

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Navigation */}
            <div className="flex flex-col gap-2">
                <Link
                    href="/"
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm ${isHome
                        ? 'bg-gradient-to-r from-green-500/10 via-yellow-500/8 to-lime-500/8 text-green-600 dark:from-green-500/15 dark:via-yellow-500/12 dark:to-lime-500/12 dark:text-green-300 border border-green-300/30 dark:border-green-500/25 shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-gradient-to-r hover:from-green-500/5 hover:via-yellow-500/3 hover:to-lime-500/5 dark:hover:from-green-500/5 dark:hover:via-yellow-500/3 dark:hover:to-lime-500/5 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                >
                    <Home size={18} className={isHome ? "text-green-500 dark:text-green-400" : "group-hover:text-neutral-900 dark:group-hover:text-white transition-colors"} />
                    <span className="font-medium">Home Feed</span>
                </Link>
                <div className="h-px bg-gradient-to-r from-transparent via-green-300/30 to-transparent dark:via-green-500/15 w-full my-2"></div>
            </div>

            {/* Channels & Categories Section */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex flex-col gap-4 overflow-y-auto pb-10 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent pr-2 relative flex-1">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-bold text-neutral-600 dark:bg-gradient-to-r dark:from-green-300 dark:to-yellow-300 dark:bg-clip-text dark:text-transparent uppercase tracking-wider">Channels</h3>
                        <button
                            onClick={() => setIsAddingCategory(true)}
                            className="text-neutral-500 hover:text-green-500/70 transition-colors"
                            title="New Category">
                            <FolderPlus size={16} />
                        </button>
                    </div>

                    {isAddingCategory && (
                        <form onSubmit={handleCreateCategory} className="px-1 animate-in slide-in-from-top-2">
                            <div className="flex gap-2">
                                <input
                                    autoFocus
                                    type="text"
                                    className="flex-1 bg-gradient-to-r from-green-900/40 to-yellow-900/40 border border-green-500/30 focus:border-green-400/60 focus:ring-1 focus:ring-green-400/30 rounded p-1 text-sm text-white placeholder-neutral-500"
                                    placeholder="Category Name"
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    onBlur={() => !newCategoryName && setIsAddingCategory(false)}
                                />
                                <button type="submit" className="text-green-400/80"><Check size={16} /></button>
                            </div>
                        </form>
                    )}

                    {interests.categories.map((category) => (
                        <CategoryList
                            key={category.id}
                            category={category}
                            allChannelsMap={allChannelsMap}
                            currentChannelId={currentChannelId}
                            editingCategoryId={editingCategoryId}
                            editCategoryName={editCategoryName}
                            setEditCategoryName={setEditCategoryName}
                            handleRemoveChannel={handleRemoveChannel}
                            saveCategoryRename={saveCategoryRename}
                            startEditingCategory={startEditingCategory}
                            handleDeleteCategory={handleDeleteCategory}
                        />
                    ))}
                </div>

                {/* Drag Overlay */}
                <DragOverlay>
                    {activeDragChannel ? (
                        <div className="opacity-90">
                            <SortableChannelItem channel={activeDragChannel} isActive={false} onRemove={() => { }} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Search Input for Channels */}
            <form onSubmit={handleSearchChannels} className="relative group px-1 mb-2 mt-auto">
                <input
                    type="text"
                    value={channelQuery}
                    onChange={(e) => setChannelQuery(e.target.value)}
                    placeholder="Search channels..."
                    className="w-full bg-gradient-to-r from-white via-green-50/15 to-yellow-50/10 dark:from-neutral-900 dark:via-green-950/10 dark:to-yellow-950/5 border border-neutral-200 dark:border-neutral-800 rounded-lg pl-3 pr-8 py-2 text-sm text-neutral-900 dark:text-neutral-300 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-green-400/40 focus:ring-1 focus:ring-green-400/30 focus:bg-gradient-to-r focus:from-white focus:via-green-50/25 focus:to-yellow-50/15 dark:focus:from-neutral-900 dark:focus:via-green-950/15 dark:focus:to-yellow-950/10 transition-all"
                />
                <button
                    type="submit"
                    disabled={!channelQuery.trim() || isSearching}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${isSearching ? 'animate-pulse text-green-500/70' : 'text-neutral-500 hover:text-green-500/70'}`}
                >
                    <Search size={16} />
                </button>
            </form>
            {channelResults.length > 0 && (
                <div className="absolute bottom-16 left-4 right-4 z-50 bg-gradient-to-br from-neutral-900 via-green-950/30 to-yellow-950/30 border border-green-500/20 rounded-xl p-2 shadow-2xl max-h-[300px] overflow-y-auto backdrop-blur-sm">
                    <div className="flex items-center justify-between px-2 py-1 mb-2">
                        <p className="text-xs text-neutral-400">Select to add:</p>
                        <button onClick={() => setChannelResults([])}><X size={14} className="text-neutral-500 hover:text-white" /></button>
                    </div>
                    {channelResults.map(c => (
                        <button
                            key={c.id}
                            onClick={() => handleAddChannel(c)}
                            disabled={addingChannelId === c.id}
                            className={`flex items-center gap-3 w-full text-left hover:bg-gradient-to-r hover:from-green-500/10 hover:via-yellow-500/8 hover:to-lime-500/8 p-2 rounded-lg transition-all ${addingChannelId === c.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {c.thumbnail && <img src={c.thumbnail} className="w-8 h-8 rounded-full" />}
                            <span className="text-sm text-neutral-200 truncate flex-1">{c.title}</span>
                            {addingChannelId === c.id ? (
                                <span className="text-xs text-green-400/80 font-medium animate-pulse">Adding...</span>
                            ) : (
                                <Plus size={14} className="text-green-400/80" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

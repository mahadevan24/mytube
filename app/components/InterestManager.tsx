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
import { Search, Plus, X, Tv, Trash2, GripVertical, FolderPlus, Edit2, Check, Loader2, Folder } from 'lucide-react';
import { useToast } from './Toast';
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
function SortableChannelItem({ 
    channel, 
    isActive, 
    onRemove, 
    isOverlay 
}: { 
    channel: Channel; 
    isActive: boolean; 
    onRemove: (e: React.MouseEvent) => void; 
    isOverlay?: boolean;
}) {
    const [imgError, setImgError] = useState(false);
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
        <li ref={setNodeRef} style={style} className={`text-sm group overflow-hidden transition-all duration-200 ${isOverlay ? 'shadow-2xl scale-105 z-50 bg-neutral-900 border border-emerald-500/40 rounded-xl' : ''}`}>
            <Link
                href={`/?channelId=${channel.id}`}
                className={`flex items-center justify-between px-2.5 py-1.5 w-full transition-all duration-200 ${isActive
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border-l-2 border-emerald-500 rounded-r-xl rounded-l-sm shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 border-l-2 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800/60 hover:text-neutral-900 dark:hover:text-white rounded-r-xl rounded-l-sm'
                    }`}
            >
                <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                    <div 
                        {...attributes} 
                        {...listeners} 
                        className="cursor-grab active:cursor-grabbing text-neutral-400 opacity-0 group-hover:opacity-100 hover:text-neutral-600 dark:hover:text-neutral-200 flex-shrink-0 transition-opacity duration-200 touch-none"
                        title="Drag to move"
                    >
                        <GripVertical size={14} />
                    </div>
                    {channel.thumbnail && !imgError ? (
                        <img 
                            src={channel.thumbnail} 
                            alt={channel.title} 
                            referrerPolicy="no-referrer"
                            onError={() => setImgError(true)}
                            className={`w-6 h-6 rounded-full flex-shrink-0 object-cover ring-1 transition-all ${isActive ? 'ring-2 ring-emerald-500' : 'ring-black/10 dark:ring-white/10 group-hover:ring-emerald-500/40'}`} 
                        />
                    ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isActive ? 'bg-emerald-500/20 text-emerald-500' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500'}`}>
                            <Tv size={12} />
                        </div>
                    )}
                    <span className="truncate text-xs font-medium tracking-tight">{channel.title}</span>
                </div>
                <button
                    onClick={onRemove}
                    className="text-neutral-400 hover:text-rose-500 dark:text-neutral-500 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all duration-150 p-1 hover:bg-rose-500/10 rounded-md flex-shrink-0 ml-1.5"
                    aria-label="Remove channel"
                    title="Remove channel"
                >
                    <X size={13} />
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
    currentCategoryId,
    editingCategoryId,
    editCategoryName,
    setEditCategoryName,
    handleRemoveChannel,
    saveCategoryRename,
    startEditingCategory,
    handleDeleteCategory
}: {
    category: Category;
    allChannelsMap: Map<string, Channel>;
    currentChannelId: string | null;
    currentCategoryId: string | null;
    editingCategoryId: string | null;
    editCategoryName: string;
    setEditCategoryName: (s: string) => void;
    handleRemoveChannel: (e: React.MouseEvent, id: string, title: string) => void;
    saveCategoryRename: (id: string) => void;
    startEditingCategory: (id: string, name: string) => void;
    handleDeleteCategory: (e: React.MouseEvent, id: string, name: string) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: category.id,
        data: { type: 'CATEGORY', category }
    });

    const isCategoryActive = currentCategoryId === category.id;
    const channelCount = category.channelIds.length;

    // Do not render empty uncategorized container to prevent huge top gaps
    if (category.id === 'uncategorized' && channelCount === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-1">
            {/* Category Header */}
            {category.id !== 'uncategorized' && (
                <div className="group flex items-center justify-between px-1 py-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                    {editingCategoryId === category.id ? (
                        <div className="flex items-center gap-1.5 flex-1">
                            <input
                                autoFocus
                                type="text"
                                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs px-2.5 py-1 rounded-lg w-full border border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                                value={editCategoryName}
                                onChange={e => setEditCategoryName(e.target.value)}
                                onBlur={() => saveCategoryRename(category.id)}
                                onKeyDown={e => e.key === 'Enter' && saveCategoryRename(category.id)}
                            />
                            <button 
                                onClick={() => saveCategoryRename(category.id)}
                                className="text-emerald-500 p-1 hover:bg-emerald-500/10 rounded-lg flex-shrink-0"
                            >
                                <Check size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between w-full">
                            <Link
                                href={`/?categoryId=${category.id}`}
                                className={`flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase flex-1 rounded-lg px-1.5 py-1 transition-all ${isCategoryActive
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                                    }`}
                                onDoubleClick={(e) => {
                                    e.preventDefault();
                                    startEditingCategory(category.id, category.name);
                                }}
                            >
                                <Folder size={13} className={isCategoryActive ? "text-emerald-500 fill-emerald-500/20" : "text-neutral-400"} />
                                <span className="truncate">{category.name}</span>
                                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-500 dark:text-neutral-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                    {channelCount}
                                </span>
                            </Link>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        startEditingCategory(category.id, category.name);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
                                    title="Rename category"
                                >
                                    <Edit2 size={11} />
                                </button>
                                {channelCount === 0 && (
                                    <button
                                        onClick={(e) => handleDeleteCategory(e, category.id, category.name)}
                                        className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
                                        title="Delete category"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
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
                    className={`space-y-1 rounded-xl p-0.5 transition-all duration-200 border ${isOver
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-inner'
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
                                onRemove={(e) => handleRemoveChannel(e, channel.id, channel.title)}
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
    const { showToast } = useToast();

    const currentChannelId = searchParams.get('channelId');
    const currentCategoryId = searchParams.get('categoryId');

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
            showToast('Search failed. Please try again.', 'error');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddChannel = async (channel: Channel) => {
        setAddingChannelId(channel.id);
        try {
            await addChannelAction(channel);
            setChannelResults([]);
            setChannelQuery('');
            showToast(`Added "${channel.title}" to channels`, 'success');
            await refreshData();
        } catch (error) {
            showToast('Failed to add channel', 'error');
        } finally {
            setAddingChannelId(null);
        }
    };

    const handleRemoveChannel = async (e: React.MouseEvent, id: string, title: string) => {
        e.preventDefault(); 
        e.stopPropagation();
        try {
            await removeChannelAction(id);
            if (currentChannelId === id) router.push('/');
            showToast(`Removed "${title}" from channels`, 'info');
            await refreshData();
        } catch (error) {
            showToast('Failed to remove channel', 'error');
        }
    };

    // --- Category Actions ---

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim()) {
            const categoryName = newCategoryName.trim();
            try {
                await addCategoryAction(categoryName);
                setNewCategoryName('');
                setIsAddingCategory(false);
                showToast(`Category "${categoryName}" created`, 'success');
                await refreshData();
            } catch (error) {
                showToast('Failed to create category', 'error');
            }
        }
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: string, name: string) => {
        e.preventDefault();
        if (confirm(`Delete category "${name}"?`)) {
            try {
                await removeCategoryAction(id);
                showToast(`Category "${name}" deleted`, 'info');
                await refreshData();
            } catch (error) {
                showToast('Failed to delete category', 'error');
            }
        }
    };

    const startEditingCategory = (id: string, currentName: string) => {
        setEditingCategoryId(id);
        setEditCategoryName(currentName);
    };

    const saveCategoryRename = async (id: string) => {
        if (editCategoryName.trim()) {
            const newName = editCategoryName.trim();
            try {
                await renameCategoryAction(id, newName);
                showToast(`Category renamed to "${newName}"`, 'success');
                await refreshData();
            } catch (error) {
                showToast('Failed to rename category', 'error');
            }
        }
        setEditingCategoryId(null);
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
                    const overIsItem = interests.channels.find(c => c.id === over.id);
                    if (overIsItem) {
                        const atIndex = destCat.channelIds.indexOf(over.id as string);
                        if (atIndex >= 0) {
                            destCat.channelIds.splice(atIndex, 0, active.id as string);
                        } else {
                            destCat.channelIds.push(active.id as string);
                        }
                    } else {
                        destCat.channelIds.push(active.id as string);
                    }
                } else {
                    if (activeContainer === overContainer) {
                        const oldIndex = interests.categories.find(c => c.id === activeContainer)?.channelIds.indexOf(active.id as string) ?? -1;
                        const newIndex = destCat.channelIds.indexOf(over.id as string);
                        if (oldIndex !== -1 && newIndex !== -1) {
                            destCat.channelIds = arrayMove(destCat.channelIds, oldIndex, newIndex);
                        }
                    }
                }
            }

            setInterests({ ...interests, categories: newCategories });
            await updateCategoriesStateAction(newCategories);

            // Trigger Toast on Container Change
            if (activeContainer !== overContainer) {
                const movedChannel = interests.channels.find(c => c.id === active.id);
                const destCategoryName = interests.categories.find(c => c.id === overContainer)?.name || 'Category';
                if (movedChannel) {
                    showToast(`Moved "${movedChannel.title}" to ${destCategoryName}`, 'info');
                }
            }
        }
    };

    if (!interests) return (
        <div className="flex items-center justify-center p-8 text-neutral-400 gap-2">
            <Loader2 size={16} className="animate-spin text-emerald-500" />
            <span className="text-xs">Loading subscriptions...</span>
        </div>
    );

    const allChannelsMap = new Map(interests.channels.map(c => [c.id, c]));

    return (
        <div className="flex flex-col h-full px-3 py-2">
            
            {/* Add Category Button / Inline Form */}
            {isAddingCategory ? (
                <form onSubmit={handleCreateCategory} className="mb-2.5 p-1.5 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-emerald-500/40 shadow-sm animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            type="text"
                            className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                            placeholder="Category Name..."
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onBlur={() => !newCategoryName && setIsAddingCategory(false)}
                        />
                        <button 
                            type="submit" 
                            disabled={!newCategoryName.trim()}
                            className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors disabled:opacity-40"
                        >
                            <Check size={16} />
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setIsAddingCategory(false)}
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full flex items-center justify-between px-3 py-2 mb-2 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/20 hover:via-teal-500/15 hover:to-emerald-500/10 border border-emerald-500/25 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-300 font-semibold text-xs transition-all duration-200 shadow-sm hover:shadow-emerald-500/10 group"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shadow-sm shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                            <Plus size={13} strokeWidth={2.5} />
                        </div>
                        <span>Add Category</span>
                    </div>
                    <FolderPlus size={14} className="text-emerald-500/70 group-hover:text-emerald-500 transition-colors" />
                </button>
            )}

            {/* Drag & Drop Channel Categories List */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-800">
                    {interests.categories.map((category) => (
                        <CategoryList
                            key={category.id}
                            category={category}
                            allChannelsMap={allChannelsMap}
                            currentChannelId={currentChannelId}
                            currentCategoryId={currentCategoryId}
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
                        <div className="opacity-95">
                            <SortableChannelItem channel={activeDragChannel} isActive={false} onRemove={() => { }} isOverlay />
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Bottom Search Bar & Search Results Dropdown */}
            <div className="pt-2 mt-2 border-t border-neutral-200/60 dark:border-white/5 relative">
                <form onSubmit={handleSearchChannels} className="relative">
                    <input
                        type="text"
                        value={channelQuery}
                        onChange={(e) => setChannelQuery(e.target.value)}
                        placeholder="Search & add channels..."
                        className="w-full bg-neutral-100/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800 rounded-xl pl-8 pr-8 py-1.5 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-200"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                    {channelQuery ? (
                        <button
                            type="button"
                            onClick={() => { setChannelQuery(''); setChannelResults([]); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
                        >
                            <X size={12} />
                        </button>
                    ) : null}
                </form>

                {/* Floating Search Results Panel */}
                {channelResults.length > 0 && (
                    <div className="absolute bottom-12 left-0 right-0 z-50 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2 shadow-2xl max-h-[280px] overflow-y-auto backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-neutral-100 dark:border-neutral-800">
                            <span className="text-[11px] font-semibold text-neutral-400">Search Results</span>
                            <button onClick={() => setChannelResults([])} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                                <X size={13} />
                            </button>
                        </div>
                        {channelResults.map(c => (
                            <button
                                key={c.id}
                                onClick={() => handleAddChannel(c)}
                                disabled={addingChannelId === c.id}
                                className="flex items-center gap-2.5 w-full text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/70 p-2 rounded-xl transition-all duration-150 group"
                            >
                                {c.thumbnail ? (
                                    <img src={c.thumbnail} alt={c.title} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-neutral-200 dark:ring-neutral-700" />
                                ) : (
                                    <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                                        <Tv size={12} />
                                    </div>
                                )}
                                <span className="text-xs text-neutral-800 dark:text-neutral-200 truncate flex-1 font-medium">{c.title}</span>
                                {addingChannelId === c.id ? (
                                    <Loader2 size={13} className="animate-spin text-emerald-500" />
                                ) : (
                                    <Plus size={14} className="text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

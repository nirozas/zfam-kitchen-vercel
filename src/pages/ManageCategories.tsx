import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, Plus, X, Upload, Loader2, Image as ImageIcon, ExternalLink, ChefHat, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Category {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
    order_index: number;
    created_at: string | null;
}

export default function ManageCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', image_url: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchCategories();
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate('/auth');
            return;
        }

        // Admin Only Check
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (profile?.role !== 'admin') {
            alert('Access Denied: Only Admins can manage categories.');
            navigate('/');
        }
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;
            setCategories(data || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category?: Category) => {
        if (category) {
            setEditingId(category.id);
            setFormData({ name: category.name, image_url: category.image_url || '' });
        } else {
            setEditingId(null);
            setFormData({ name: '', image_url: '' });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        try {
            const payload = {
                name: formData.name,
                slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
                image_url: formData.image_url || null
            };

            if (editingId) {
                const { error } = await supabase.from('categories').update(payload).eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('categories').insert([payload]);
                if (error) throw error;
            }

            await fetchCategories();
            setShowModal(false);
        } catch (error) {
            alert('Operation failed: ' + (error as Error).message);
        }
    };

    const deleteCategory = async (id: number) => {
        if (!confirm('Are you sure you want to delete this category?')) return;
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            await fetchCategories();
        } catch (error) {
            alert('Delete failed');
        }
    };

    const moveCategory = async (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= categories.length) return;

        const updatedCategories = [...categories];
        const temp = updatedCategories[index];
        updatedCategories[index] = updatedCategories[newIndex];
        updatedCategories[newIndex] = temp;

        // Update indices locally first for immediate feedback
        setCategories(updatedCategories);

        try {
            // Update order_index in database for both categories
            const updates = [
                { id: updatedCategories[index].id, order_index: index },
                { id: updatedCategories[newIndex].id, order_index: newIndex }
            ];

            for (const update of updates) {
                const { error } = await supabase
                    .from('categories')
                    .update({ order_index: update.order_index })
                    .eq('id', update.id);
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error updating order:', error);
            fetchCategories(); // Re-sync if failed
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Manage Categories</h1>
                    <p className="text-gray-500 mt-2 font-medium italic">Organize your recipes with style</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-3 bg-primary-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 active:scale-95"
                >
                    <Plus size={24} strokeWidth={3} />
                    Create New Category
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence>
                    {categories.map((category) => (
                        <motion.div
                            layout
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group relative bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                        >
                            <Link to={`/category/${category.slug}`} className="block flex-1">
                                {/* Image Container */}
                                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                                    {category.image_url ? (
                                        <img
                                            src={category.image_url}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            alt={category.name}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                            <ChefHat size={64} strokeWidth={1} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[10px] font-black uppercase tracking-widest text-gray-900 rounded-full shadow-sm w-fit">
                                            Collection
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveCategory(categories.indexOf(category), 'up'); }}
                                                disabled={categories.indexOf(category) === 0}
                                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-sm border border-gray-100"
                                            >
                                                <ChevronUp size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); moveCategory(categories.indexOf(category), 'down'); }}
                                                disabled={categories.indexOf(category) === categories.length - 1}
                                                className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-gray-900 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed shadow-sm border border-gray-100"
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Header */}
                                <div className="p-8 pb-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-500 mb-1 leading-none">Category</span>
                                        <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-primary-600 transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm font-medium text-gray-400 mt-1 italic">/{category.slug}</p>
                                    </div>
                                </div>
                            </Link>

                            {/* Actions */}
                            <div className="px-8 pb-8 mt-auto">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleOpenModal(category);
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-primary-50 hover:text-primary-600 transition-all border border-transparent hover:border-primary-100"
                                    >
                                        <Pencil size={18} />
                                        Edit Category
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Premium Modal */}
            <AnimatePresence>
                {
                    showModal && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-gray-100"
                            >
                                <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
                                            <ImageIcon size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 leading-none">
                                                {editingId ? 'Edit Category' : 'New Category'}
                                            </h3>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter mt-1">Refine your collections</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 block px-1">Display Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Italian Mediterranean"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-primary-500 outline-none font-bold text-gray-900 transition-all placeholder:text-gray-300"
                                            autoFocus
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 block px-1">Cover Image</label>

                                        {/* Preview container */}
                                        <div className="w-full aspect-video rounded-[1.5rem] bg-gray-100 overflow-hidden relative border-2 border-dashed border-gray-200 group/preview">
                                            {formData.image_url ? (
                                                <>
                                                    <img src={formData.image_url} className="w-full h-full object-cover" alt="" />
                                                    <button
                                                        onClick={() => setFormData({ ...formData, image_url: '' })}
                                                        className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover/preview:opacity-100"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                                    {uploading ? <Loader2 className="w-8 h-8 animate-spin text-primary-500" /> : <ImageIcon className="text-gray-300" size={40} />}
                                                    <p className="text-xs font-black uppercase text-gray-400 tracking-widest">No Image Selected</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-4">
                                            <div className="relative flex-1">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Paste an image URL..."
                                                    value={formData.image_url}
                                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 outline-none font-bold text-xs"
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={async (e) => {
                                                        try {
                                                            setUploading(true);
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            const fileExt = file.name.split('.').pop();
                                                            const fileName = `${Math.random()}.${fileExt}`;
                                                            const filePath = `categories/${fileName}`;

                                                            const { error: uploadError } = await supabase.storage.from('recipes').upload(filePath, file);
                                                            if (uploadError) throw uploadError;

                                                            const { data } = supabase.storage.from('recipes').getPublicUrl(filePath);
                                                            setFormData({ ...formData, image_url: data.publicUrl });
                                                        } catch (err) {
                                                            alert('Upload failed: ' + (err as Error).message);
                                                        } finally {
                                                            setUploading(false);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    disabled={uploading}
                                                />
                                                <button className="h-full px-6 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-100 transition-all font-black text-xs uppercase tracking-tighter flex items-center gap-2">
                                                    {uploading ? <Loader2 className="animate-spin h-3 w-3" /> : <Upload className="h-3 w-3" />}
                                                    Upload
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50/50 flex gap-4">
                                    {editingId && (
                                        <button
                                            onClick={() => deleteCategory(editingId)}
                                            className="p-4 bg-white border border-red-100 text-red-500 rounded-[1.5rem] hover:bg-red-50 transition-all group/del"
                                            title="Delete Category"
                                        >
                                            <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-4 px-6 border border-gray-200 rounded-[1.5rem] font-bold text-gray-500 hover:bg-white hover:text-gray-700 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!formData.name.trim() || uploading}
                                        className="flex-[2] py-4 px-6 bg-primary-600 text-white rounded-[1.5rem] font-black text-lg shadow-lg shadow-primary-100 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                    >
                                        {editingId ? 'Update Category' : 'Create Category'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}

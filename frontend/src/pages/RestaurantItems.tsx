import React, { useState, useEffect } from 'react';
import api from '../api';
import { Product, Category, Variant } from '../types';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  X, 
  Image as ImageIcon,
  Tag,
  Boxes,
  HelpCircle,
  Upload,
  AlertTriangle
} from 'lucide-react';

export const RestaurantItems: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [variants, setVariants] = useState<Variant[]>([]);

  // Image Upload Fields
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImagesToKeep, setExistingImagesToKeep] = useState<string[]>([]);

  // Delete Confirm Modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = `/restaurant/products?search=${encodeURIComponent(search)}&category=${categoryFilter}&status=${statusFilter}`;
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/restaurant/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setDiscountPrice('');
    setCategoryId(categories[0]?._id || '');
    setQuantity('');
    setStatus('active');
    setVariants([]);
    setNewImages([]);
    setNewImagePreviews([]);
    setExistingImagesToKeep([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditProduct(prod);
    setName(prod.name);
    setDescription(prod.description || '');
    setPrice(prod.price.toString());
    setDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setCategoryId(typeof prod.categoryId === 'object' ? prod.categoryId._id : prod.categoryId);
    setQuantity(prod.quantity !== undefined ? prod.quantity.toString() : '');
    setStatus(prod.status);
    setVariants(prod.variants || []);
    setNewImages([]);
    setNewImagePreviews([]);
    setExistingImagesToKeep(prod.images || []);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const availableSlots = 3 - (existingImagesToKeep.length + newImages.length);
    if (availableSlots <= 0) {
      alert('You can upload a maximum of 3 images total.');
      return;
    }

    const selectedFiles = Array.from(files).slice(0, availableSlots);
    const newFiles = [...newImages, ...selectedFiles];
    setNewImages(newFiles);

    const previews = selectedFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...previews]);
  };

  const handleRemoveNewImage = (index: number) => {
    const updatedFiles = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
    setNewImages(updatedFiles);
    setNewImagePreviews(updatedPreviews);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImagesToKeep(existingImagesToKeep.filter((_, i) => i !== index));
  };

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: 0, discountPrice: undefined }]);
  };

  const handleUpdateVariant = (index: number, key: keyof Variant, value: any) => {
    const updated = [...variants];
    if (key === 'price') {
      updated[index].price = value === '' ? 0 : Number(value);
    } else if (key === 'discountPrice') {
      updated[index].discountPrice = value === '' ? undefined : Number(value);
    } else if (key === 'name') {
      updated[index].name = value;
    }
    setVariants(updated);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId) return;

    setFormLoading(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('discountPrice', discountPrice);
    formData.append('categoryId', categoryId);
    formData.append('quantity', quantity);
    formData.append('status', status);
    formData.append('variants', JSON.stringify(variants));

    // Append existing images to keep
    existingImagesToKeep.forEach(img => {
      formData.append('existingImages', img);
    });

    // Append new uploaded files
    newImages.forEach(file => {
      formData.append('images', file);
    });

    try {
      if (editProduct) {
        await api.put(`/restaurant/products/${editProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/restaurant/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save product');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (prod: Product) => {
    try {
      const targetStatus = prod.status === 'active' ? 'inactive' : 'active';
      await api.put(`/restaurant/products/${prod._id}`, {
        status: targetStatus,
      });
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle product status');
    }
  };

  const handleOpenDelete = (prod: Product) => {
    setProductToDelete(prod);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/restaurant/products/${productToDelete._id}`);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Filters & Add Button */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-grow max-w-4xl">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-sans"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-all font-sans"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900/60 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-all font-sans"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Add Button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-slate-950 font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/10 text-sm flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-slate-500">
              <Boxes className="w-8 h-8" />
            </div>
            <p className="text-slate-400 font-sans text-sm">No items found. Click Add Product to create one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-sans text-sm">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {prod.image ? (
                            <img src={`http://localhost:5000${prod.image}`} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{prod.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-1 max-w-[200px]">{prod.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2.5 py-1 rounded-lg text-xs">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        <span>{typeof prod.categoryId === 'object' ? prod.categoryId.name : 'Unknown'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-300">
                      {prod.discountPrice ? (
                        <div className="flex flex-col">
                          <span className="text-amber-500 font-bold">${prod.discountPrice.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500 line-through font-normal">${prod.price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span>${prod.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {prod.quantity !== undefined ? (
                        prod.quantity === 0 ? (
                          <span className="text-rose-500 bg-rose-500/10 border border-rose-500/25 px-2 py-0.5 rounded text-xs font-bold">Out of stock</span>
                        ) : (
                          <span className="text-amber-500 font-bold">{prod.quantity} units</span>
                        )
                      ) : (
                        <span className="text-slate-500 text-xs">Unlimited</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(prod)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all border ${
                          prod.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {prod.status === 'active' ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => handleOpenEdit(prod)}
                          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(prod)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Popup Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 glass-card">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="font-bold text-white tracking-wide">
                {editProduct ? 'Edit Product Item' : 'Add Product Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Name */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Classic Beef Burger"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                  />
                </div>

                {/* Category Dropdown */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Category Dropdown *
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                  >
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Short Description
                </label>
                <textarea
                  placeholder="e.g. Juicy double flame-grilled beef patty with Swiss cheese..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 9.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
                  />
                </div>

                {/* Discount Price */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Discount Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.99"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
                  />
                </div>

                {/* Quantity (Optional) */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Quantity (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
                  />
                </div>
              </div>

              {/* Status Visibility */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Visibility Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                >
                  <option value="active">Active (Visible in QR menu)</option>
                  <option value="inactive">Inactive (Hidden from QR menu)</option>
                </select>
              </div>

              {/* Images Section */}
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Product Images (Maximum 3)
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Existing Images */}
                  {existingImagesToKeep.map((imgUrl, i) => (
                    <div key={`exist-${i}`} className="relative aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group">
                      <img src={`http://localhost:5000${imgUrl}`} alt="Existing" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(i)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* New Image Previews */}
                  {newImagePreviews.map((previewUrl, i) => (
                    <div key={`new-${i}`} className="relative aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group">
                      <img src={previewUrl} alt="New Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(i)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-rose-400 hover:text-white hover:bg-rose-600 transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Trigger Card */}
                  {(existingImagesToKeep.length + newImages.length) < 3 && (
                    <label className="relative aspect-square bg-slate-950 border border-dashed border-slate-850 hover:border-amber-500/50 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-900/10">
                      <Upload className="w-5 h-5 text-slate-500" />
                      <span className="text-[10px] text-slate-400 font-bold">Upload Image</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Variants Section */}
              <div className="border-t border-slate-850 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-xs font-bold uppercase tracking-wider">Product Variants (Optional)</span>
                    <span title="Add custom sizes, additions, combos etc.">
                      <HelpCircle className="w-4 h-4 text-slate-500 cursor-help" />
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="flex items-center gap-1.5 text-xs text-amber-500 hover:text-amber-400 font-bold px-3 py-1.5 rounded-lg hover:bg-amber-500/5 border border-transparent hover:border-amber-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Variant</span>
                  </button>
                </div>

                {variants.length === 0 ? (
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    No variants added. Product will be sold as a single item with the base price.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {variants.map((v, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950 p-4 border border-slate-850 rounded-2xl">
                        {/* Variant Name */}
                        <div className="flex-grow">
                          <input
                            type="text"
                            placeholder="Variant Name (e.g. Small / Large / Extra Cheese)"
                            value={v.name}
                            onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                          />
                        </div>

                        {/* Variant Price */}
                        <div className="w-full sm:w-28">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={v.price || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
                          />
                        </div>

                        {/* Variant Discount Price */}
                        <div className="w-full sm:w-32">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Discount Price"
                            value={v.discountPrice || ''}
                            onChange={(e) => handleUpdateVariant(idx, 'discountPrice', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans font-mono"
                          />
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all flex-shrink-0 self-end sm:self-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Controls */}
              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading || !name || !price || !categoryId}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
                >
                  {formLoading && <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                  <span>{editProduct ? 'Save Product' : 'Create Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden z-10 glass-card">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-white">Delete Product Item?</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans max-w-xs mx-auto">
                  Are you sure you want to delete <span className="font-semibold text-slate-200">"{productToDelete?.name}"</span>? 
                  This will remove the product and all associated variant/image details permanently.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-md shadow-rose-600/10"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

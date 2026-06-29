import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  UtensilsCrossed, 
  ShieldAlert, 
  ShoppingBag, 
  Plus, 
  Minus, 
  X, 
  Store, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  User,
  Phone,
  Calculator,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Product, Category, Variant } from '../types';
import { NoticeBox } from '../components/NoticeBox';
import { useTheme } from '../contexts/ThemeContext';

interface CartItem {
  productId: string;
  name: string;
  image?: string;
  variantName?: string;
  quantity: number;
  price: number;
  baseProduct: Product;
}

export const RestaurantMenuStub: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Portal Data
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [superAdminAlert, setSuperAdminAlert] = useState<string | null>(null);

  // Filter Category
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Variant Modal State
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [chosenVariant, setChosenVariant] = useState<Variant | null>(null);

  // Theme State
  const { theme, toggleTheme } = useTheme();

  // Details Modal State
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  useEffect(() => {
    setCurrentImgIndex(0);
  }, [selectedProductForDetails]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    const prod = selectedProductForDetails;
    if (!prod) return;
    const galleryImages = prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []);
    
    if (touchStartX - touchEndX > 50) {
      if (currentImgIndex < galleryImages.length - 1) {
        setCurrentImgIndex(currentImgIndex + 1);
      }
    }
    if (touchStartX - touchEndX < -50) {
      if (currentImgIndex > 0) {
        setCurrentImgIndex(currentImgIndex - 1);
      }
    }
  };

  // Checkout Modal State
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // API base URL
  const API_URL = 'http://localhost:5000/api';

  // 1. Fetch Portal Details & Track Unique Visitor
  useEffect(() => {
    const fetchPortalData = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/restaurant/${slug}/portal`);
        setRestaurant(res.data.restaurant);
        setCategories(res.data.categories);
        setProducts(res.data.products);
        setSuperAdminAlert(res.data.alert);
        setLoading(false);

        // Visitor tracker (Unique per slug using localStorage)
        const visitedKey = `visited-${slug}`;
        if (!localStorage.getItem(visitedKey)) {
          await axios.post(`${API_URL}/auth/restaurant/${slug}/visit`);
          localStorage.setItem(visitedKey, 'true');
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Failed to load restaurant QR menu.');
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [slug]);

  // Load cart from LocalStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${slug}`);
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart');
      }
    }
  }, [slug]);

  // Save cart to LocalStorage on update
  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`cart-${slug}`, JSON.stringify(newCart));
  };

  // Add to Cart Logic
  const handleAddToCart = (product: Product, variant?: Variant) => {
    const isVariant = !!variant;
    const price = variant 
      ? (variant.discountPrice !== undefined ? variant.discountPrice : variant.price) 
      : (product.discountPrice !== undefined ? product.discountPrice : product.price);
    const variantName = variant ? variant.name : undefined;

    const existingIndex = cart.findIndex(
      item => item.productId === product._id && item.variantName === variantName
    );

    const updated = [...cart];
    if (existingIndex > -1) {
      // Check stock limits if set
      if (product.quantity !== undefined && updated[existingIndex].quantity >= product.quantity) {
        alert(`Cannot add more. Only ${product.quantity} items left in stock.`);
        return;
      }
      updated[existingIndex].quantity += 1;
    } else {
      updated.push({
        productId: product._id,
        name: product.name,
        image: product.image,
        variantName,
        quantity: 1,
        price,
        baseProduct: product
      });
    }
    saveCart(updated);
    setVariantModalOpen(false);
  };

  const handleDecreaseQuantity = (index: number) => {
    const updated = [...cart];
    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
    } else {
      updated.splice(index, 1);
    }
    saveCart(updated);
  };

  const handleIncreaseQuantity = (index: number) => {
    const updated = [...cart];
    const product = updated[index].baseProduct;
    if (product.quantity !== undefined && updated[index].quantity >= product.quantity) {
      alert(`Cannot add more. Only ${product.quantity} items left in stock.`);
      return;
    }
    updated[index].quantity += 1;
    saveCart(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...cart];
    updated.splice(index, 1);
    saveCart(updated);
  };

  const handlePlusClick = (product: Product) => {
    if (product.quantity !== undefined && product.quantity <= 0) {
      return; // Out of stock
    }
    if (product.variants && product.variants.length > 0) {
      setSelectedProductForVariant(product);
      setChosenVariant(product.variants[0]);
      setVariantModalOpen(true);
    } else {
      handleAddToCart(product);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !tableNumber.trim()) return;

    setCheckoutLoading(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        tableNumber: tableNumber.trim(),
        items: cart.map(item => ({
          productId: item.productId,
          variantName: item.variantName,
          quantity: item.quantity
        }))
      };

      const res = await axios.post(`${API_URL}/auth/restaurant/${slug}/checkout`, payload);
      setOrderSuccess(res.data);
      // Clear Cart
      saveCart([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing your checkout.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Calculations
  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vatRate = restaurant?.vatPercentage || 0;
  const cartVat = cartSubtotal * (vatRate / 100);
  const cartGrandTotal = cartSubtotal + cartVat;

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory || (typeof p.categoryId === 'object' && p.categoryId._id === selectedCategory));

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl border border-rose-500/10 bg-slate-900/50 backdrop-blur-xl shadow-2xl glass-card flex flex-col items-center gap-5">
          <div className="bg-rose-500/10 p-4 rounded-2xl text-rose-500 border border-rose-500/20">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Menu Unavailable</h2>
          <p className="text-sm text-slate-400 leading-relaxed font-sans">{errorMsg}</p>
          <a href="/" className="mt-2 text-xs font-semibold text-amber-500 hover:underline">Return Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-24 font-sans select-none">
      {/* Banner */}
      <div className="relative h-44 sm:h-56 w-full bg-slate-900 overflow-hidden">
        {restaurant.banner ? (
          <img src={`http://localhost:5000${restaurant.banner}`} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-amber-600/30 to-orange-600/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/20" />
      </div>

      {/* Brand Info Overlay */}
      <div className="max-w-4xl w-full mx-auto px-4 -mt-16 sm:-mt-20 relative z-10 space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-900 border-4 border-slate-950 flex items-center justify-center overflow-hidden shadow-2xl">
              {restaurant.logo ? (
                <img src={`http://localhost:5000${restaurant.logo}`} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Store className="w-10 h-10 text-amber-500" />
              )}
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow">
                {restaurant.name}
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide drop-shadow">
                📍 {restaurant.location}
              </p>
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-2xl bg-slate-900/60 border border-slate-850 text-slate-400 hover:text-amber-500 hover:bg-slate-900 transition-all cursor-pointer shadow-lg backdrop-blur flex-shrink-0"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        {/* Super Admin Alert Notification inside menu portal */}
        {superAdminAlert && (
          <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 animate-pulse" />
            <p className="text-xs text-amber-300 leading-relaxed font-sans">{superAdminAlert}</p>
          </div>
        )}

        {/* Category Slider Section */}
        <div className="border-t border-slate-900 pt-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Explore Menu</h3>
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border flex-shrink-0 ${
                  selectedCategory === cat._id
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="pt-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm font-sans">
              No products found under this category.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map(prod => {
                const isOutOfStock = prod.quantity !== undefined && prod.quantity <= 0;
                return (
                  <div 
                    key={prod._id}
                    onClick={() => {
                      setSelectedProductForDetails(prod);
                      setDetailsModalOpen(true);
                    }}
                    className="bg-slate-900/30 border border-slate-900 p-4 rounded-3xl flex items-center justify-between gap-4 backdrop-blur transition-all hover:bg-slate-900/40 cursor-pointer hover:border-amber-500/25"
                  >
                    <div className="space-y-2 flex-grow min-w-0">
                      <div>
                        <h4 className="font-bold text-slate-200 text-sm leading-tight truncate">{prod.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed max-w-[280px]">
                          {prod.description || 'No description available'}
                        </p>
                      </div>

                      <div className="flex items-baseline gap-2 font-mono">
                        {prod.discountPrice !== undefined ? (
                          <>
                            <span className="text-sm font-bold text-amber-500">${prod.discountPrice.toFixed(2)}</span>
                            <span className="text-[10px] text-slate-500 line-through">${prod.price.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-sm font-bold text-slate-300">${prod.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>

                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {prod.image ? (
                        <img src={`http://localhost:5000${prod.image}`} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-6 h-6 text-slate-700" />
                      )}

                      {/* Add Button Overlay */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlusClick(prod);
                        }}
                        disabled={isOutOfStock}
                        className={`absolute bottom-2 right-2 p-1.5 rounded-xl shadow-lg border transition-all ${
                          isOutOfStock
                            ? 'bg-rose-950/80 border-rose-900 text-rose-500 pointer-events-none'
                            : 'bg-amber-500 hover:bg-amber-600 border-amber-400 text-slate-950 active:scale-[0.9]'
                        }`}
                      >
                        {isOutOfStock ? (
                          <span className="text-[8px] font-extrabold uppercase px-1">Sold Out</span>
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Cart Bar */}
      {cart.length > 0 && !cartOpen && !checkoutOpen && (
        <div className="fixed bottom-6 left-4 right-4 z-40 max-w-lg mx-auto bg-amber-500 text-slate-950 px-5 py-4 rounded-2xl flex items-center justify-between shadow-2xl animate-bounce-slow">
          <div className="flex items-center gap-3">
            <div className="bg-slate-950 text-amber-500 w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm relative">
              {cartTotalItems}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900 leading-tight">Total Price</p>
              <p className="font-extrabold font-mono text-sm">${cartGrandTotal.toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-1.5 bg-slate-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl hover:bg-slate-900 transition-all active:scale-[0.98]"
          >
            <span>View Cart</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Product Details Modal */}
      {detailsModalOpen && selectedProductForDetails && (() => {
        const prod = selectedProductForDetails;
        const galleryImages = prod.images && prod.images.length > 0 ? prod.images : (prod.image ? [prod.image] : []);
        const categoryName = typeof prod.categoryId === 'object' ? prod.categoryId.name : categories.find(c => c._id === prod.categoryId)?.name || 'General';
        const hasVariants = prod.variants && prod.variants.length > 0;
        const isOutOfStock = prod.quantity !== undefined && prod.quantity <= 0;

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop Overlay */}
            <div 
              className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-300" 
              onClick={() => setDetailsModalOpen(false)} 
            />
            
            {/* Modal Container */}
            <div 
              className="relative bg-slate-900 border border-slate-800 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 glass-card max-h-[90vh] flex flex-col transform transition-all duration-300 animate-slide-up sm:animate-scale-up"
            >
              {/* Image Gallery Section */}
              <div className="relative w-full aspect-video sm:aspect-square bg-slate-950 overflow-hidden flex-shrink-0 group">
                {galleryImages.length > 0 ? (
                  <div 
                    className="w-full h-full relative"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <img 
                      src={`http://localhost:5000${galleryImages[currentImgIndex]}`} 
                      alt={prod.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-800">
                    <UtensilsCrossed className="w-16 h-16 animate-pulse" />
                  </div>
                )}

                {/* Close Button */}
                <button 
                  onClick={() => setDetailsModalOpen(false)} 
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-slate-300 hover:text-white transition-all cursor-pointer z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Previous/Next Desktop Chevrons */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentImgIndex > 0) setCurrentImgIndex(currentImgIndex - 1);
                      }}
                      disabled={currentImgIndex === 0}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all hidden sm:flex cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentImgIndex < galleryImages.length - 1) setCurrentImgIndex(currentImgIndex + 1);
                      }}
                      disabled={currentImgIndex === galleryImages.length - 1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/75 transition-all hidden sm:flex cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Indicators (Dots) */}
                {galleryImages.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-20">
                    {galleryImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImgIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          idx === currentImgIndex ? 'bg-amber-500 w-4' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Product Content Details */}
              <div className="p-6 overflow-y-auto space-y-4 flex-grow">
                {/* Category & Stock Status */}
                <div className="flex items-center justify-between">
                  <span className="bg-amber-500/10 text-amber-500 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-amber-500/20">
                    {categoryName}
                  </span>
                  {isOutOfStock && (
                    <span className="bg-rose-500/10 text-rose-500 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md border border-rose-500/20">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Name */}
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-100 leading-tight">
                  {prod.name}
                </h3>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 font-mono">
                  {prod.discountPrice !== undefined ? (
                    <>
                      <span className="text-xl font-extrabold text-amber-500">${prod.discountPrice.toFixed(2)}</span>
                      <span className="text-xs text-slate-500 line-through">${prod.price.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-xl font-extrabold text-slate-200">${prod.price.toFixed(2)}</span>
                  )}
                </div>

                {/* Description (Supports multi-line) */}
                <div className="border-t border-slate-800 pt-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h4>
                  <p className="text-sm text-slate-400 leading-relaxed font-sans whitespace-pre-line">
                    {prod.description || 'No description available for this delicious item.'}
                  </p>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex-shrink-0">
                <button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    if (hasVariants) {
                      handlePlusClick(prod);
                    } else {
                      handleAddToCart(prod);
                    }
                  }}
                  disabled={isOutOfStock}
                  className={`w-full py-3 px-6 rounded-2xl font-extrabold text-sm tracking-wide shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isOutOfStock
                      ? 'bg-slate-800 text-slate-600 pointer-events-none'
                      : 'bg-amber-500 hover:bg-amber-600 border border-amber-400 text-slate-950 active:scale-[0.98]'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{hasVariants ? 'Customize & Add to Cart' : 'Add to Cart'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Variant Selection Modal (Professional Bottom Sheet / Modal) */}
      {variantModalOpen && selectedProductForVariant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setVariantModalOpen(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 glass-card max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
              <h3 className="font-bold text-white tracking-wide text-sm truncate">Customize Item</h3>
              <button onClick={() => setVariantModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-grow">
              {/* Product Info */}
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedProductForVariant.image ? (
                    <img src={`http://localhost:5000${selectedProductForVariant.image}`} alt={selectedProductForVariant.name} className="w-full h-full object-cover" />
                  ) : (
                    <UtensilsCrossed className="w-5 h-5 text-slate-700" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-200 text-sm leading-snug">{selectedProductForVariant.name}</h4>
                  <p className="text-xs text-slate-500 leading-normal">{selectedProductForVariant.description || 'No description available'}</p>
                </div>
              </div>

              {/* Variants Choice */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Choose Option</span>
                <div className="space-y-2">
                  {selectedProductForVariant.variants.map((v, i) => {
                    const price = v.discountPrice !== undefined ? v.discountPrice : v.price;
                    return (
                      <label
                        key={i}
                        onClick={() => setChosenVariant(v)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          chosenVariant?.name === v.name
                            ? 'bg-amber-500/10 border-amber-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-850 text-slate-300 hover:bg-slate-950/70'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="variantGroup"
                            checked={chosenVariant?.name === v.name}
                            onChange={() => {}}
                            className="w-4 h-4 accent-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold">{v.name}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-amber-500">${price.toFixed(2)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-850 flex items-center justify-between gap-4">
              <div className="font-mono">
                <p className="text-[10px] text-slate-500 leading-tight uppercase font-semibold">Custom Price</p>
                <p className="font-extrabold text-sm text-amber-500">
                  ${chosenVariant ? (chosenVariant.discountPrice !== undefined ? chosenVariant.discountPrice : chosenVariant.price).toFixed(2) : '0.00'}
                </p>
              </div>
              <button
                onClick={() => chosenVariant && handleAddToCart(selectedProductForVariant, chosenVariant)}
                className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 px-6 rounded-xl text-xs transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Sliding Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-950 h-full shadow-2xl flex flex-col border-l border-slate-900 z-10 animate-slide-left">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900 bg-slate-900/20">
              <div className="flex items-center gap-2 text-slate-200">
                <ShoppingBag className="w-5 h-5 text-amber-500" />
                <span className="font-bold tracking-wide">My Cart ({cartTotalItems} items)</span>
              </div>
              <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Cart List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-sm font-sans gap-3">
                  <ShoppingBag className="w-10 h-10 text-slate-700" />
                  <span>Your cart is empty. Add items from the menu to checkout.</span>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 border border-slate-900 rounded-2xl bg-slate-900/10 relative overflow-hidden">
                    <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={`http://localhost:5000${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <UtensilsCrossed className="w-5 h-5 text-slate-700" />
                      )}
                    </div>

                    <div className="flex-grow min-w-0 space-y-2">
                      <div>
                        <h4 className="font-bold text-slate-200 text-xs truncate leading-snug">{item.name}</h4>
                        {item.variantName && (
                          <span className="inline-block text-[10px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded mt-1">
                            {item.variantName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 p-1.5 rounded-xl">
                          <button
                            onClick={() => handleDecreaseQuantity(idx)}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-xs text-white px-1.5">{item.quantity}</span>
                          <button
                            onClick={() => handleIncreaseQuantity(idx)}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-mono font-bold text-xs text-amber-500">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="absolute top-3 right-3 text-slate-650 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Cart Actions */}
            {cart.length > 0 && (
              <div className="p-6 bg-slate-900/25 border-t border-slate-900 space-y-4">
                <div className="space-y-2 text-xs font-semibold text-slate-400 font-sans">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-200">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT ({vatRate}%)</span>
                    <span className="font-mono text-slate-200">${cartVat.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-900 pt-3 text-sm text-white font-extrabold">
                    <span>Grand Total</span>
                    <span className="font-mono text-amber-500">${cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3.5 rounded-xl text-xs transition-all active:scale-[0.98] shadow-lg shadow-amber-500/10"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Checkout Overlay */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCheckoutOpen(false)} />
          <div className="relative bg-slate-950 border border-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900 bg-slate-900/20">
              <span className="font-bold text-white tracking-wide text-sm">Place Order Checkout</span>
              <button 
                onClick={() => {
                  if (orderSuccess) {
                    setOrderSuccess(null);
                  }
                  setCheckoutOpen(false);
                }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              {orderSuccess ? (
                /* Success View */
                <div className="text-center py-8 space-y-5">
                  <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Order Confirmed!</h3>
                    <p className="text-slate-400 text-xs leading-relaxed font-sans max-w-xs mx-auto">
                      Thank you for dining with us! Your order has been registered in the kitchen.
                    </p>
                  </div>

                  <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/25 max-w-sm mx-auto space-y-1.5">
                    <span className="text-[10px] text-amber-500 uppercase tracking-widest font-extrabold">Notice Box Message</span>
                    <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-850 text-xs font-mono text-slate-200">
                      ID: {orderSuccess.orderId}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans">
                      A simulated SMS containing your order ID has been logged in development mode. Look for the SMS notice box popup!
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      setCheckoutOpen(false);
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-6 rounded-xl text-xs transition-all active:scale-[0.98]"
                  >
                    Back to Menu
                  </button>
                </div>
              ) : (
                /* Checkout Form & Summary */
                <form onSubmit={handleCheckoutSubmit} className="space-y-6 font-sans">
                  {/* Summary */}
                  <div className="space-y-3 bg-slate-900/25 border border-slate-900 p-4 rounded-2xl">
                    <div className="flex items-center gap-1.5 text-slate-300 text-xs font-bold uppercase tracking-wider mb-2">
                      <Calculator className="w-4 h-4 text-amber-500" />
                      <span>Order Summary</span>
                    </div>

                    <div className="space-y-2 text-xs text-slate-400">
                      {cart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="truncate max-w-[200px]">
                            {item.name} {item.variantName ? `(${item.variantName})` : ''} <span className="text-slate-500 font-bold">x{item.quantity}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-300">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      
                      <div className="border-t border-slate-900 pt-3 flex justify-between font-bold">
                        <span>Subtotal</span>
                        <span className="font-mono text-slate-300">${cartSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span>VAT ({vatRate}%)</span>
                        <span className="font-mono text-slate-300">${cartVat.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-white font-extrabold border-t border-slate-900 pt-3">
                        <span>Grand Total</span>
                        <span className="font-mono text-amber-500">${cartGrandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="e.g. 01712345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                        Table Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Table 5"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2.5 px-4 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCheckoutOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-850 text-slate-300 font-semibold text-xs transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={checkoutLoading || !fullName.trim() || !phone.trim() || !tableNumber.trim()}
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/10 flex items-center justify-center gap-1.5"
                    >
                      {checkoutLoading && <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                      <span>Complete Order</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Brand Footer */}
      <footer className="w-full border-t border-slate-900/60 py-6 text-center text-[10px] text-slate-600 font-mono flex flex-col sm:flex-row items-center justify-center gap-2 mt-auto">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>QR Order SaaS Menu</span>
        </div>
        <span className="hidden sm:inline">•</span>
        <span>Powered by Antigravity Platform</span>
      </footer>

      {/* Render Notice Box directly on Portal for simulation visibility */}
      <NoticeBox />
    </div>
  );
};

// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState, useEffect, useRef } from 'react';
import { Category, Transaction, Family, Currency, ReminderFrequency, TransactionItem } from '../types';
import { suggestCategory, parseReceipt } from '../services/geminiService';
import { showAlert } from '../services/alertService';
import { Sparkles, Repeat, Users, Plus, Trash2, ShoppingBag, Camera, Loader2, ScanLine, Edit2, Check, X, Calendar, Tag, Image as ImageIcon } from 'lucide-react';
import { CURRENCY_USD, CURRENCY_KHR } from '../constants';

interface TransactionFormProps {
  categories: Category[];
  familyMembers: Family[];
  defaultCurrency: Currency;
  initialData?: Transaction | null;
  onSave: (t: Transaction) => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ categories, familyMembers, defaultCurrency, initialData, onSave, onCancel }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [familyId, setFamilyId] = useState('');
  
  // Use local date for default value to avoid timezone issues
  const getLocalDate = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const local = new Date(now.getTime() - offset);
    return local.toISOString().split('T')[0];
  };
  const [date, setDate] = useState(getLocalDate());
  
  const [reminder, setReminder] = useState<ReminderFrequency>('NONE');
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Item/Receipt State
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Initialize Form Data (Edit Mode vs Add Mode)
  useEffect(() => {
    if (initialData) {
        // EDIT MODE
        setAmount(initialData.amount.toString());
        setCurrency(initialData.currency);
        setDescription(initialData.description || '');
        setCategoryId(initialData.categoryId);
        setFamilyId(initialData.familyId || '');
        setDate(initialData.date);
        setReminder(initialData.reminder || 'NONE');
        setItems(initialData.items || []);
    } else {
        // ADD MODE (Reset)
        setAmount('');
        setCurrency(defaultCurrency);
        setDescription('');
        if (categories.length > 0) setCategoryId(categories[0]._id);
        setFamilyId('');
        setDate(getLocalDate());
        setReminder('NONE');
        setItems([]);
    }
  }, [initialData, defaultCurrency, categories]);

  // Fix: Ensure categoryId is set when categories are loaded (Only if not editing)
  useEffect(() => {
    if (!categoryId && categories.length > 0 && !initialData) {
        setCategoryId(categories[0]._id);
    }
  }, [categories, categoryId, initialData]);

  // Auto-calculate total amount when items change
  useEffect(() => {
    if (items.length > 0) {
        const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        setAmount(total.toFixed(2));
    }
  }, [items]);

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount) {
        showAlert("Missing Info", "សូមបញ្ចូលចំនួនទឹកប្រាក់ (Please enter amount)", "warning");
        return;
    }

    if (!categoryId) {
        showAlert("Missing Info", "សូមជ្រើសរើសប្រភេទ (Please select category)", "warning");
        return;
    }

    const newTransaction: Transaction = {
      _id: initialData ? initialData._id : Date.now().toString(),
      amount: parseFloat(amount),
      currency,
      description,
      categoryId,
      familyId: familyId || undefined,
      date, // Transaction Date
      createdAt: initialData ? initialData.createdAt : new Date().toISOString(), // Preserve creation date on edit
      reminder,
      items: items.length > 0 ? items : undefined
    };

    onSave(newTransaction);
  };

  const handleAddItem = (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent form submit
      if (!newItemName || !newItemPrice) return;

      const priceVal = parseFloat(newItemPrice) || 0;
      const qtyVal = parseFloat(newItemQty) || 1;

      if (editingItemId) {
          // Update existing item
          setItems(items.map(item => 
              item.id === editingItemId 
              ? { ...item, name: newItemName, quantity: qtyVal, price: priceVal }
              : item
          ));
          setEditingItemId(null);
      } else {
          // Add new item
          const newItem: TransactionItem = {
              id: Date.now().toString(),
              name: newItemName,
              quantity: qtyVal,
              price: priceVal
          };
          setItems([...items, newItem]);
      }

      // Reset fields
      setNewItemName('');
      setNewItemQty('1');
      setNewItemPrice('');
  };

  const startEditItem = (item: TransactionItem) => {
      setNewItemName(item.name);
      setNewItemQty(item.quantity.toString());
      setNewItemPrice(item.price.toString());
      setEditingItemId(item.id);
      setShowItemForm(true);
  };

  const cancelEditItem = () => {
      setNewItemName('');
      setNewItemQty('1');
      setNewItemPrice('');
      setEditingItemId(null);
  };

  const handleRemoveItem = (id: string) => {
      setItems(items.filter(i => i.id !== id));
      if (editingItemId === id) {
          cancelEditItem();
      }
  };

  const handleDescriptionBlur = async () => {
    if (!description || description.length < 3) return;
    
    // Only suggest if not already categorized via scan to avoid overwriting user intent too aggressively
    if (isSuggesting) return;

    setIsSuggesting(true);
    const suggestedId = await suggestCategory(description, categories);
    if (suggestedId) {
        setCategoryId(suggestedId);
    }
    setIsSuggesting(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await scanReceiptFile(file);

      // Reset input
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const closeCamera = () => {
      cameraStreamRef.current?.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOpen(false);
  };

  const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
          // Older mobile browsers can still open their native camera through this input.
          cameraInputRef.current?.click();
          return;
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: { ideal: 'environment' } },
              audio: false
          });
          cameraStreamRef.current = stream;
          setIsCameraOpen(true);

          // The video element is mounted after the state update.
          requestAnimationFrame(() => {
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  void videoRef.current.play();
              }
          });
      } catch (error) {
          console.error('Unable to open camera:', error);
          showAlert(
              'Camera unavailable',
              'សូមអនុញ្ញាតឱ្យប្រើកាមេរ៉ា ហើយព្យាយាមម្តងទៀត។ (Please allow camera access and try again.)',
              'warning'
          );
      }
  };

  const capturePhoto = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
          if (!blob) return;
          const file = new File([blob], `receipt-${Date.now()}.jpg`, { type: 'image/jpeg' });
          closeCamera();
          void scanReceiptFile(file);
      }, 'image/jpeg', 0.92);
  };

  const scanReceiptFile = async (file: File) => {
      setIsScanning(true);
      const data = await parseReceipt(file, categories);
      setIsScanning(false);

      if (data) {
          if (data.amount) setAmount(data.amount.toString());
          if (data.currency) setCurrency(data.currency);
          if (data.date) setDate(data.date);
          if (data.description) setDescription(data.description);
          if (data.categoryId) setCategoryId(data.categoryId);
          if (data.items && data.items.length > 0) {
              setItems(data.items);
              setShowItemForm(true);
          }
      } else {
          showAlert("Scan Error", "មិនអាចអានវិក្កយបត្របានទេ។ សូមព្យាយាមម្តងទៀត ឬបញ្ចូលដោយដៃ។ (Could not read receipt)", "error");
      }
  };

  // Filter categories for easy selection (group by Income/Expense)
  const incomeCats = categories.filter(c => !c.chomnay);
  const expenseCats = categories.filter(c => c.chomnay);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-20 md:mb-6">
      
      {/* Header with Scan Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">
            {initialData ? 'កែប្រែប្រតិបត្តិការ (Edit Transaction)' : 'ប្រតិបត្តិការថ្មី (New)'}
        </h2>
        <div className="flex gap-2">
            <input 
                type="file" 
                ref={cameraInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
                capture="environment"
            />
            <input 
                type="file" 
                ref={galleryInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageUpload}
            />
            
            <button 
                type="button"
                onClick={openCamera}
                disabled={isScanning}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                title="Use Camera"
            >
                {isScanning ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                <span className="hidden sm:inline">Camera</span>
            </button>
            <button 
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isScanning}
                className="flex items-center gap-2 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors"
                title="Upload from Gallery"
            >
                <ImageIcon size={16} />
                <span className="hidden sm:inline">Gallery</span>
            </button>
        </div>
      </div>

      {isCameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Capture receipt">
              <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                  <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-contain"
                  />
                  <button
                      type="button"
                      onClick={closeCamera}
                      className="absolute top-4 right-4 rounded-full bg-black/60 p-3 text-white"
                      aria-label="Close camera"
                  >
                      <X size={24} />
                  </button>
              </div>
              <div className="flex shrink-0 items-center justify-center bg-black px-6 py-6 safe-area-inset-bottom">
                  <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/25"
                      aria-label="Take photo"
                  >
                      <span className="h-16 w-16 rounded-full bg-white" />
                  </button>
              </div>
          </div>
      )}

      {isScanning && (
          <div className="mb-6 bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex items-center justify-center gap-3 animate-pulse">
              <ScanLine className="text-indigo-500" />
              <p className="text-sm text-indigo-700 font-medium">កំពុងវិភាគវិក្កយបត្រ (Analyzing Receipt)...</p>
          </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Top Section: Amount & Description Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Amount & Currency Row */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                ចំនួនទឹកប្រាក់ (Amount)
                {items.length > 0 && <span className="text-xs font-normal text-indigo-500 ml-2">(ពីបញ្ជីទំនិញ)</span>}
            </label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                <input
                    type="number"
                    step={currency === 'USD' ? "0.01" : "100"}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    readOnly={items.length > 0}
                    className={`w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-lg font-mono ${items.length > 0 ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                    placeholder="0.00"
                    required
                />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${currency === 'USD' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    {CURRENCY_USD}
                </button>
                <button
                    type="button"
                    onClick={() => setCurrency('KHR')}
                    className={`px-3 py-1 rounded-lg font-medium text-sm transition-all ${currency === 'KHR' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                    {CURRENCY_KHR}
                </button>
                </div>
            </div>
            </div>

            {/* Description */}
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">បរិយាយ (Description)</label>
            <div className="relative">
                <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="Ex: ញាំបាយព្រឹក"
                />
                {isSuggesting && (
                    <div className="absolute right-3 top-3 text-indigo-500 animate-pulse">
                        <Sparkles size={16} />
                    </div>
                )}
            </div>
            </div>
        </div>

        {/* Date & Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ប្រភេទ (Category)</label>
                <div className="relative">
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white appearance-none"
                    >
                        {expenseCats.length > 0 && (
                            <optgroup label="ចំណាយ (Expense)">
                                {expenseCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </optgroup>
                        )}
                        {incomeCats.length > 0 && (
                            <optgroup label="ចំណូល (Income)">
                                {incomeCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </optgroup>
                        )}
                    </select>
                    <Tag className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Date */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">កាលបរិច្ឆេទ (Date)</label>
                <div className="relative">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white"
                    />
                    <Calendar className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>

        {/* Family & Reminder Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Family Member */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">សមាជិក (Family)</label>
                <div className="relative">
                    <select
                        value={familyId}
                        onChange={(e) => setFamilyId(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white appearance-none"
                    >
                        <option value="">ខ្ញុំ (Me)</option>
                        {familyMembers.map(f => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                        ))}
                    </select>
                    <Users className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>

            {/* Reminder */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ការរំលឹក (Reminder)</label>
                <div className="relative">
                    <select
                        value={reminder}
                        onChange={(e) => setReminder(e.target.value as ReminderFrequency)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white appearance-none"
                    >
                        <option value="NONE">គ្មាន (None)</option>
                        <option value="MONTHLY">រៀងរាល់ខែ (Monthly)</option>
                        <option value="YEARLY">រៀងរាល់ឆ្នាំ (Yearly)</option>
                    </select>
                    <Repeat className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={16} />
                </div>
            </div>
        </div>

        {/* --- ITEMS SECTION (Receipt Details) --- */}
        <div className="border-t border-gray-100 pt-4 mt-2">
            <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-indigo-600" />
                    មុខទំនិញ (Receipt Items)
                </label>
                <button 
                    type="button"
                    onClick={() => setShowItemForm(!showItemForm)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-lg"
                >
                    {showItemForm ? 'លាក់ (Hide)' : 'បង្ហាញ/បន្ថែម (Show/Add)'}
                </button>
            </div>

            {/* Item List */}
            {items.length > 0 && (
                <div className="space-y-2 mb-4">
                    {items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.quantity} x {item.price}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-mono font-bold text-gray-700">{(item.quantity * item.price).toFixed(2)}</span>
                                <div className="flex gap-1">
                                    <button type="button" onClick={() => startEditItem(item)} className="p-1 text-gray-400 hover:text-indigo-600"><Edit2 size={14} /></button>
                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Item Form */}
            {showItemForm && (
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-6">
                            <input 
                                type="text" placeholder="ឈ្មោះទំនិញ (Name)" 
                                className="w-full p-2 text-sm border rounded-lg"
                                value={newItemName} onChange={e => setNewItemName(e.target.value)}
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" placeholder="ចំនួន (Qty)" step="1"
                                className="w-full p-2 text-sm border rounded-lg"
                                value={newItemQty} onChange={e => setNewItemQty(e.target.value)}
                            />
                        </div>
                        <div className="col-span-3">
                            <input 
                                type="number" placeholder="តម្លៃ (Price)" step="0.01"
                                className="w-full p-2 text-sm border rounded-lg"
                                value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        {editingItemId && (
                            <button 
                                type="button" onClick={cancelEditItem}
                                className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-xs font-bold rounded-lg"
                            >
                                Cancel
                            </button>
                        )}
                        <button 
                            type="button" onClick={handleAddItem}
                            disabled={!newItemName}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {editingItemId ? <Check size={14} /> : <Plus size={14} />}
                            {editingItemId ? 'Update' : 'Add Item'}
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
                បោះបង់ (Cancel)
            </button>
            <button
                type="submit"
                className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-transform active:scale-[0.98]"
            >
                រក្សាទុក (Save)
            </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;

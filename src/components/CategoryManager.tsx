// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Tomorrow Rich Together
import React, { useState } from 'react';
import { Category } from '../types';
import { Plus, Trash2, Tag, AlertCircle } from 'lucide-react';
import { deleteCategory } from '../services/storageService';
import { showAlert, showConfirm } from '../services/alertService';

interface CategoryManagerProps {
  categories: Category[];
  onAdd: (c: Category) => void;
  onDelete: (id: string) => void;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ categories, onAdd, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('expense'); // 'income' or 'expense'
  const [newColor, setNewColor] = useState('#6366F1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const newCategory: Category = {
      _id: Date.now().toString(),
      name: newName,
      chomnay: newType === 'expense',
      color: newColor,
      order: categories.length + 1
    };

    onAdd(newCategory);
    setIsAdding(false);
    setNewName('');
    setNewColor('#6366F1');
  };

  const handleDelete = async (id: string) => {
      const confirmed = await showConfirm("លុបប្រភេទនេះ?", "ការលុបមិនប៉ះពាល់ដល់ប្រតិបត្តិការចាស់ទេ។");
      if (!confirmed) return;

      const result = await deleteCategory(id);
      if (result.success) {
          onDelete(id); // Update parent state via callback if needed, or trigger refresh
      } else {
          showAlert("កំហុស (Error)", result.error, "error");
      }
  };

  return (
    <div className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-indigo-600" size={24} />
            គ្រប់គ្រងប្រភេទ (Categories)
        </h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-100 text-indigo-700 p-2 rounded-full hover:bg-indigo-200 transition-colors shadow-sm"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 animate-in slide-in-from-top-2">
           <h3 className="font-bold text-gray-700 mb-3 text-sm">បង្កើតប្រភេទថ្មី (New Category)</h3>
           <div className="space-y-4">
             <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">ឈ្មោះ (Name)</label>
                 <input
                   type="text"
                   placeholder="Ex: ថ្លៃសាំង..."
                   value={newName}
                   onChange={e => setNewName(e.target.value)}
                   className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                   required
                 />
             </div>
             
             <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">ប្រភេទ (Type)</label>
                 <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                   <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${newType === 'income' ? 'bg-white shadow text-green-600 font-bold' : 'text-gray-500'}`}>
                     <input 
                        type="radio" 
                        name="type" 
                        className="hidden"
                        checked={newType === 'income'} 
                        onChange={() => setNewType('income')} 
                     />
                     <span>ចំណូល (Income)</span>
                   </label>
                   <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${newType === 'expense' ? 'bg-white shadow text-red-600 font-bold' : 'text-gray-500'}`}>
                     <input 
                        type="radio" 
                        name="type" 
                        className="hidden"
                        checked={newType === 'expense'} 
                        onChange={() => setNewType('expense')} 
                     />
                     <span>ចំណាយ (Expense)</span>
                   </label>
                 </div>
             </div>

             <div className="flex items-center gap-3">
               <span className="text-xs font-medium text-gray-500">ពណ៌ (Color):</span>
               <input 
                 type="color" 
                 value={newColor} 
                 onChange={e => setNewColor(e.target.value)}
                 className="h-8 w-16 cursor-pointer border-0 rounded bg-transparent"
               />
             </div>
             
             <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md">
               បង្កើត (Create)
             </button>
           </div>
        </form>
      )}

      <div className="space-y-2">
        {categories.map((cat) => (
          <div key={cat._id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" 
                style={{ backgroundColor: cat.color }}
              >
                  {cat.name.charAt(0)}
              </div>
              <div>
                  <p className="font-bold text-gray-800">{cat.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.chomnay ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {cat.chomnay ? 'Expense' : 'Income'}
                  </span>
              </div>
            </div>
            <button 
                onClick={() => handleDelete(cat._id)}
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
                <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;

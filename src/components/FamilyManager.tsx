
import React, { useState } from 'react';
import { Family } from '../types';
import { Plus, Trash2, Users } from 'lucide-react';
import { deleteFamilyMember } from '../services/storageService';
import { showConfirm, showAlert } from '../services/alertService';

interface FamilyManagerProps {
  members: Family[];
  onAdd: (f: Family) => void;
  onDelete: (id: string) => void;
}

const FamilyManager: React.FC<FamilyManagerProps> = ({ members, onAdd, onDelete }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const newMember: Family = {
      _id: Date.now().toString(),
      name: name.trim()
    };

    onAdd(newMember);
    setName('');
  };

  const handleDelete = async (id: string) => {
      const confirmed = await showConfirm("លុបសមាជិកនេះ? (Delete Member?)", "តើអ្នកប្រាកដថាចង់លុបសមាជិកគ្រួសារនេះមែនទេ? (Are you sure?)");
      if (!confirmed) return;

      const result = await deleteFamilyMember(id);
      if (result.success) {
          onDelete(id);
      } else {
          showAlert("កំហុស (Error)", result.error, "error");
      }
  };

  return (
    <div className="pb-24">
      <div className="flex items-center gap-2 mb-6">
         <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
            <Users size={20} />
         </div>
         <h2 className="text-xl font-bold text-gray-800">សមាជិកគ្រួសារ (Family Members)</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ឈ្មោះសមាជិក (Member Name)"
          className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
        />
        <button type="submit" className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-md transition-colors">
          <Plus size={24} />
        </button>
      </form>

      <div className="space-y-2">
        {members.map((m) => (
          <div key={m._id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 hover:border-indigo-100 transition-colors">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                    {m.name.charAt(0)}
                </div>
                <span className="font-bold text-gray-700">{m.name}</span>
            </div>
            <button 
                onClick={() => handleDelete(m._id)} 
                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {members.length === 0 && (
          <div className="text-center py-8 bg-white/50 rounded-xl border border-dashed border-gray-200">
             <Users size={48} className="mx-auto text-gray-300 mb-2" />
             <p className="text-gray-400 text-sm">មិនទាន់មានសមាជិក។ សូមបន្ថែមឈ្មោះ។</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyManager;

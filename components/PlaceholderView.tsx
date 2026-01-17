import React from 'react';
import { Settings } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
}

const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
    <div className="p-6 bg-slate-50 rounded-full mb-4">
      <Settings size={48} className="text-slate-300" />
    </div>
    <h3 className="text-xl font-bold text-slate-700">{title}</h3>
    <p className="mt-2 text-center max-w-md">Modul ini adalah bagian dari spesifikasi Proyek Dasar tetapi belum diimplementasikan sepenuhnya dalam demo ini.</p>
  </div>
);

export default PlaceholderView;

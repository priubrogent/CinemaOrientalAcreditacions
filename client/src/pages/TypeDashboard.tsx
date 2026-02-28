import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAccreditations, fetchAvailableCodes } from '../api/accreditations';
import AccreditationList from '../components/AccreditationList';
import TestAccreditationForm from '../components/TestAccreditationForm';
import type { AccreditationType } from '../types';

const TYPE_DISPLAY_NAMES: Record<AccreditationType, string> = {
  premsa: 'Premsa',
  professional: 'Professional',
  nitoman: 'Nitoman',
};

type ViewMode = 'cards' | 'list';

export default function TypeDashboard() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const { data: accreditations = [], isLoading: accreditationsLoading } = useQuery({
    queryKey: ['accreditations', type],
    queryFn: () => fetchAccreditations(type),
    refetchInterval: 30000,
    enabled: !!type,
  });

  const { data: codesData } = useQuery({
    queryKey: ['codes', type, 'available'],
    queryFn: () => fetchAvailableCodes(type!),
    enabled: !!type,
  });

  const pendingCount = accreditations.filter(a => a.status === 'pending').length;
  const codeAssignedCount = accreditations.filter(a => a.status === 'code_assigned').length;

  const downloadCSV = () => {
    const headers = ['ID', 'Comanda', 'Nom', 'Email', 'Codi', 'Estat', 'Data creació', 'Email enviat'];
    const rows = accreditations.map(a => [
      a.id,
      a.order_id,
      a.customer_name,
      a.customer_email,
      a.code || '',
      a.status,
      a.created_at,
      a.email_sent_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `acreditacions_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!type) return null;

  return (
    <div>
      {/* Stats bar - responsive grid */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 lg:mb-6">
        <div className="grid grid-cols-2 gap-3 sm:flex sm:gap-6 text-sm">
          <div>
            <span className="text-gray-500">Total:</span>{' '}
            <span className="font-medium">{accreditations.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Pendents:</span>{' '}
            <span className="font-medium text-amber-600">{pendingCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Per enviar:</span>{' '}
            <span className="font-medium text-blue-600">{codeAssignedCount}</span>
          </div>
          <div>
            <span className="text-gray-500">Codis:</span>{' '}
            <span className="font-medium text-green-600">{codesData?.count ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Header - responsive layout */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Acreditacions {TYPE_DISPLAY_NAMES[type]}
        </h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'cards' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Targetes
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded ${
                viewMode === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Llista
            </button>
          </div>

          {/* CSV Download - hidden on very small screens */}
          <button
            onClick={downloadCSV}
            disabled={accreditations.length === 0}
            className="hidden sm:block px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            CSV
          </button>

          <TestAccreditationForm type={type} />
        </div>
      </div>

      <AccreditationList
        accreditations={accreditations}
        isLoading={accreditationsLoading}
        viewMode={viewMode}
        type={type}
      />
    </div>
  );
}

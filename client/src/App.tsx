import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAccreditations, fetchAvailableCodes } from './api/accreditations';
import AccreditationList from './components/AccreditationList';
import CodePoolManager from './components/CodePoolManager';
import EmailTemplateEditor from './components/EmailTemplateEditor';
import TestAccreditationForm from './components/TestAccreditationForm';
import Settings from './components/Settings';

type Tab = 'accreditations' | 'codes' | 'templates' | 'settings';
type ViewMode = 'cards' | 'list';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('accreditations');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const { data: accreditations = [], isLoading: accreditationsLoading } = useQuery({
    queryKey: ['accreditations'],
    queryFn: fetchAccreditations,
    refetchInterval: 30000,
  });

  const { data: codesData } = useQuery({
    queryKey: ['codes', 'premsa', 'available'],
    queryFn: () => fetchAvailableCodes('premsa'),
  });

  const pendingCount = accreditations.filter(a => a.status === 'pending').length;
  const codeAssignedCount = accreditations.filter(a => a.status === 'code_assigned').length;

  const tabs = [
    { id: 'accreditations' as Tab, label: 'Acreditacions', badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'codes' as Tab, label: 'Codis', badge: codesData?.count },
    { id: 'templates' as Tab, label: 'Plantilla' },
    { id: 'settings' as Tab, label: 'Configuració' },
  ];

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
    link.download = `acreditacions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
              LOGO
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Asian Summer Film Festival</h1>
              <p className="text-sm text-gray-500">Gestió d'Acreditacions de Premsa</p>
            </div>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex gap-6 text-sm">
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
              <span className="text-gray-500">Codis disponibles:</span>{' '}
              <span className="font-medium text-green-600">{codesData?.count ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'accreditations' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Acreditacions de Premsa</h2>
              <div className="flex items-center gap-3">
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

                {/* CSV Download */}
                <button
                  onClick={downloadCSV}
                  disabled={accreditations.length === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Descarregar CSV
                </button>

                <TestAccreditationForm />
              </div>
            </div>
            <AccreditationList
              accreditations={accreditations}
              isLoading={accreditationsLoading}
              viewMode={viewMode}
            />
          </div>
        )}

        {activeTab === 'codes' && <CodePoolManager />}

        {activeTab === 'templates' && <EmailTemplateEditor />}

        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <p className="text-xs text-gray-400 text-center">
            Asian Summer Film Festival - Sistema de Gestió d'Acreditacions
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;

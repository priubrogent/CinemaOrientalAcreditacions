import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCodes, addBulkCodes, deleteCode } from '../api/accreditations';
import type { Code, AccreditationType } from '../types';

const TYPE_DISPLAY_NAMES: Record<AccreditationType, string> = {
  premsa: 'Premsa',
  professional: 'Professional',
  nitoman: 'Nitoman',
};

export default function CodePoolManager() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [bulkInput, setBulkInput] = useState('');
  const [showAll, setShowAll] = useState(false);
  const queryClient = useQueryClient();

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['codes', type],
    queryFn: () => fetchCodes(type),
    enabled: !!type,
  });

  const addBulkMutation = useMutation({
    mutationFn: (codeList: string[]) => addBulkCodes(codeList, type!),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      setBulkInput('');
      alert(`Afegits ${result.inserted} codis (${result.duplicates} duplicats ignorats)`);
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCode,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['codes', type] }),
    onError: (err: Error) => alert(err.message),
  });

  const handleAddBulk = () => {
    const codeList = bulkInput.split('\n').filter(c => c.trim());
    if (codeList.length === 0) {
      alert('Introdueix almenys un codi');
      return;
    }
    addBulkMutation.mutate(codeList);
  };

  const availableCodes = codes.filter(c => !c.is_used);
  const usedCodes = codes.filter(c => c.is_used);
  const displayCodes = showAll ? codes : availableCodes.slice(0, 10);

  if (!type) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Codis {TYPE_DISPLAY_NAMES[type]}
      </h2>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{codes.length}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-green-50 rounded p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{availableCodes.length}</div>
          <div className="text-sm text-gray-500">Disponibles</div>
        </div>
        <div className="bg-blue-50 rounded p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{usedCodes.length}</div>
          <div className="text-sm text-gray-500">Assignats</div>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Afegir codis (un per línia)
        </label>
        <textarea
          value={bulkInput}
          onChange={(e) => setBulkInput(e.target.value)}
          placeholder={`${type.toUpperCase()}-001\n${type.toUpperCase()}-002\n${type.toUpperCase()}-003`}
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleAddBulk}
          disabled={addBulkMutation.isPending || !bulkInput.trim()}
          className="mt-2 px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addBulkMutation.isPending ? 'Afegint...' : 'Afegir codis'}
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700">
            {showAll ? 'Tots els codis' : 'Codis disponibles'}
          </h3>
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-blue-600 hover:underline"
          >
            {showAll ? 'Mostrar només disponibles' : 'Mostrar tots'}
          </button>
        </div>

        {isLoading ? (
          <p className="text-gray-500 text-sm">Carregant...</p>
        ) : displayCodes.length === 0 ? (
          <p className="text-gray-500 text-sm">No hi ha codis disponibles</p>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {displayCodes.map((code: Code) => (
              <div key={code.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <code className={`font-mono ${code.is_used ? 'text-gray-400' : 'text-gray-900'}`}>
                  {code.code}
                </code>
                <div className="flex items-center gap-2">
                  {code.is_used ? (
                    <span className="text-xs text-gray-400">Assignat</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm(`Eliminar el codi ${code.code}?`)) {
                          deleteMutation.mutate(code.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {!showAll && availableCodes.length > 10 && (
          <p className="text-sm text-gray-500 mt-2">
            Mostrant 10 de {availableCodes.length} codis disponibles
          </p>
        )}
      </div>
    </div>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Accreditation, AccreditationType } from '../types';
import { assignCode, sendEmail, deleteAccreditation } from '../api/accreditations';
import { useState } from 'react';

type ViewMode = 'cards' | 'list';

interface Props {
  accreditations: Accreditation[];
  isLoading: boolean;
  viewMode: ViewMode;
  type?: AccreditationType;
}

function StatusBadge({ status }: { status: Accreditation['status'] }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-700 border border-gray-300',
    code_assigned: 'bg-blue-50 text-blue-700 border border-blue-200',
    email_sent: 'bg-green-50 text-green-700 border border-green-200',
  };

  const labels = {
    pending: 'Pendent',
    code_assigned: 'Codi assignat',
    email_sent: 'Email enviat',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function AccreditationRow({ accreditation, type }: { accreditation: Accreditation; type?: AccreditationType }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const assignCodeMutation = useMutation({
    mutationFn: () => assignCode(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendEmail(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccreditation(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const isLoading = assignCodeMutation.isPending || sendEmailMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-3 px-4">
          <div className="font-medium text-gray-900">{accreditation.customer_name}</div>
          <div className="text-sm text-gray-500">{accreditation.customer_email}</div>
        </td>
        <td className="py-3 px-4 text-sm text-gray-600">#{accreditation.order_id}</td>
        <td className="py-3 px-4">
          {accreditation.code ? (
            <code className="bg-gray-100 px-2 py-0.5 rounded text-sm">{accreditation.code}</code>
          ) : (
            <span className="text-gray-400 text-sm">-</span>
          )}
        </td>
        <td className="py-3 px-4">
          <StatusBadge status={accreditation.status} />
        </td>
        <td className="py-3 px-4 text-sm text-gray-600">
          {new Date(accreditation.created_at).toLocaleDateString('ca-ES')}
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            {accreditation.status === 'pending' && (
              <button
                onClick={() => assignCodeMutation.mutate()}
                disabled={isLoading}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {assignCodeMutation.isPending ? '...' : 'Assignar'}
              </button>
            )}
            {accreditation.status === 'code_assigned' && (
              <button
                onClick={() => sendEmailMutation.mutate()}
                disabled={isLoading}
                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {sendEmailMutation.isPending ? '...' : 'Enviar'}
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Segur que vols eliminar aquesta acreditació?')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={isLoading}
              className="px-2 py-1 text-xs text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
            >
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={6} className="px-4 py-2 bg-red-50 text-sm text-red-700">{error}</td>
        </tr>
      )}
    </>
  );
}

function AccreditationCard({ accreditation, type }: { accreditation: Accreditation; type?: AccreditationType }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const assignCodeMutation = useMutation({
    mutationFn: () => assignCode(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendEmail(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccreditation(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      queryClient.invalidateQueries({ queryKey: ['codes', type] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const isLoading = assignCodeMutation.isPending || sendEmailMutation.isPending || deleteMutation.isPending;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-gray-900 truncate">{accreditation.customer_name}</h3>
          <p className="text-sm text-gray-500 truncate">{accreditation.customer_email}</p>
        </div>
        <StatusBadge status={accreditation.status} />
      </div>

      <div className="text-sm text-gray-600 mb-2 sm:mb-3 space-y-0.5 sm:space-y-1">
        <p><span className="font-medium">Comanda:</span> #{accreditation.order_id}</p>
        {accreditation.code && (
          <p className="truncate"><span className="font-medium">Codi:</span> <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{accreditation.code}</code></p>
        )}
        <p><span className="font-medium">Data:</span> {new Date(accreditation.created_at).toLocaleDateString('ca-ES')}</p>
      </div>

      {error && (
        <div className="mb-2 sm:mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {accreditation.status === 'pending' && (
          <button
            onClick={() => assignCodeMutation.mutate()}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignCodeMutation.isPending ? '...' : 'Assignar'}
          </button>
        )}

        {accreditation.status === 'code_assigned' && (
          <button
            onClick={() => sendEmailMutation.mutate()}
            disabled={isLoading}
            className="flex-1 sm:flex-none px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendEmailMutation.isPending ? '...' : 'Enviar'}
          </button>
        )}

        {accreditation.status === 'email_sent' && (
          <span className="text-xs sm:text-sm text-green-600">
            Enviat {new Date(accreditation.email_sent_at!).toLocaleDateString('ca-ES')}
          </span>
        )}

        <button
          onClick={() => {
            if (confirm('Segur que vols eliminar aquesta acreditació?')) {
              deleteMutation.mutate();
            }
          }}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function AccreditationList({ accreditations, isLoading, viewMode, type }: Props) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Carregant acreditacions...
      </div>
    );
  }

  if (accreditations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="font-medium">Encara no hi ha acreditacions</p>
        <p className="text-sm mt-1">Les noves compres apareixeran aquí automàticament</p>
      </div>
    );
  }

  // On mobile, always show cards
  if (viewMode === 'list') {
    return (
      <>
        {/* Table view for desktop */}
        <div className="hidden md:block border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Comanda</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Codi</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estat</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Data</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Accions</th>
              </tr>
            </thead>
            <tbody>
              {accreditations.map((accreditation) => (
                <AccreditationRow key={accreditation.id} accreditation={accreditation} type={type} />
              ))}
            </tbody>
          </table>
        </div>
        {/* Card view for mobile even in list mode */}
        <div className="md:hidden grid gap-3">
          {accreditations.map((accreditation) => (
            <AccreditationCard key={accreditation.id} accreditation={accreditation} type={type} />
          ))}
        </div>
      </>
    );
  }

  return (
    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accreditations.map((accreditation) => (
        <AccreditationCard key={accreditation.id} accreditation={accreditation} type={type} />
      ))}
    </div>
  );
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Accreditation } from '../types';
import { assignCode, sendEmail, deleteAccreditation } from '../api/accreditations';
import { useState } from 'react';

interface Props {
  accreditations: Accreditation[];
  isLoading: boolean;
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

function AccreditationCard({ accreditation }: { accreditation: Accreditation }) {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const assignCodeMutation = useMutation({
    mutationFn: () => assignCode(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations'] });
      queryClient.invalidateQueries({ queryKey: ['codes'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => sendEmail(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations'] });
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAccreditation(accreditation.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations'] });
      queryClient.invalidateQueries({ queryKey: ['codes'] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const isLoading = assignCodeMutation.isPending || sendEmailMutation.isPending || deleteMutation.isPending;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{accreditation.customer_name}</h3>
          <p className="text-sm text-gray-500">{accreditation.customer_email}</p>
        </div>
        <StatusBadge status={accreditation.status} />
      </div>

      <div className="text-sm text-gray-600 mb-3 space-y-1">
        <p><span className="font-medium">Comanda:</span> #{accreditation.order_id}</p>
        {accreditation.code && (
          <p><span className="font-medium">Codi:</span> <code className="bg-gray-100 px-2 py-0.5 rounded">{accreditation.code}</code></p>
        )}
        <p><span className="font-medium">Data:</span> {new Date(accreditation.created_at).toLocaleDateString('ca-ES')}</p>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {accreditation.status === 'pending' && (
          <button
            onClick={() => assignCodeMutation.mutate()}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assignCodeMutation.isPending ? 'Assignant...' : 'Assignar codi'}
          </button>
        )}

        {accreditation.status === 'code_assigned' && (
          <button
            onClick={() => sendEmailMutation.mutate()}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendEmailMutation.isPending ? 'Enviant...' : 'Enviar email'}
          </button>
        )}

        {accreditation.status === 'email_sent' && (
          <span className="text-sm text-green-600">
            Enviat el {new Date(accreditation.email_sent_at!).toLocaleDateString('ca-ES')}
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

export default function AccreditationList({ accreditations, isLoading }: Props) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accreditations.map((accreditation) => (
        <AccreditationCard key={accreditation.id} accreditation={accreditation} />
      ))}
    </div>
  );
}

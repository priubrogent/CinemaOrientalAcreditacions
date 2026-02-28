import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTestAccreditation } from '../api/accreditations';
import type { AccreditationType } from '../types';

interface Props {
  type: AccreditationType;
}

export default function TestAccreditationForm({ type }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createTestAccreditation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accreditations', type] });
      setOrderId('');
      setName('');
      setEmail('');
      setIsOpen(false);
    },
    onError: (err: Error) => alert(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      order_id: orderId,
      customer_name: name,
      customer_email: email,
      type,
    });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-gray-500 hover:text-gray-700 underline"
      >
        + Afegir acreditació de prova
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Nova acreditació de prova</h3>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="ID Comanda"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      <div className="flex gap-2 mt-3">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creant...' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Cancel·lar
        </button>
      </div>
    </form>
  );
}

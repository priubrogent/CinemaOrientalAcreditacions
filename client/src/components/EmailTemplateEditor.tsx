import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTemplates, updateTemplate, previewTemplate } from '../api/accreditations';
import type { EmailTemplate, AccreditationType } from '../types';

const TYPE_DISPLAY_NAMES: Record<AccreditationType, string> = {
  premsa: 'Premsa',
  professional: 'Professional',
  nitoman: 'Nitoman',
};

export default function EmailTemplateEditor() {
  const { type } = useParams<{ type: AccreditationType }>();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<{ subject: string; body: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', type],
    queryFn: () => fetchTemplates(type),
    enabled: !!type,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; subject: string; body: string }) =>
      updateTemplate(data.id, { subject: data.subject, body: data.body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', type] });
      alert('Plantilla guardada');
    },
    onError: (err: Error) => alert(err.message),
  });

  const previewMutation = useMutation({
    mutationFn: (id: number) => previewTemplate(id),
    onSuccess: (data) => {
      setPreview(data);
      setShowPreview(true);
    },
    onError: (err: Error) => alert(err.message),
  });

  useEffect(() => {
    if (templates.length > 0 && !selectedId) {
      const template = templates[0];
      setSelectedId(template.id);
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [templates, selectedId]);

  // Reset when type changes
  useEffect(() => {
    setSelectedId(null);
    setShowPreview(false);
  }, [type]);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedId(template.id);
    setSubject(template.subject);
    setBody(template.body);
    setShowPreview(false);
  };

  const handleSave = () => {
    if (!selectedId) return;
    updateMutation.mutate({ id: selectedId, subject, body });
  };

  const handlePreview = () => {
    if (!selectedId) return;
    updateMutation.mutate({ id: selectedId, subject, body }, {
      onSuccess: () => previewMutation.mutate(selectedId),
    });
  };

  if (!type) return null;

  if (isLoading) {
    return <div className="text-gray-500">Carregant plantilles...</div>;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Plantilla d'Email - {TYPE_DISPLAY_NAMES[type]}
      </h2>

      {templates.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Plantilla</label>
          <select
            value={selectedId || ''}
            onChange={(e) => {
              const t = templates.find(t => t.id === Number(e.target.value));
              if (t) handleSelectTemplate(t);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Assumpte</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cos del missatge (HTML)
        </label>
        <div className="text-xs text-gray-500 mb-2">
          Variables disponibles: <code className="bg-gray-100 px-1">{'{{name}}'}</code>{' '}
          <code className="bg-gray-100 px-1">{'{{code}}'}</code>{' '}
          <code className="bg-gray-100 px-1">{'{{order_id}}'}</code>{' '}
          <code className="bg-gray-100 px-1">{'{{email}}'}</code>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Guardant...' : 'Guardar'}
        </button>
        <button
          onClick={handlePreview}
          disabled={previewMutation.isPending}
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          {previewMutation.isPending ? 'Carregant...' : 'Previsualitzar'}
        </button>
      </div>

      {showPreview && preview && (
        <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Previsualització</span>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              Tancar
            </button>
          </div>
          <div className="p-4">
            <div className="mb-2">
              <span className="text-sm text-gray-500">Assumpte:</span>{' '}
              <span className="font-medium">{preview.subject}</span>
            </div>
            <div className="border border-gray-100 rounded bg-white">
              <iframe
                srcDoc={preview.body}
                className="w-full h-96 border-0"
                title="Email preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

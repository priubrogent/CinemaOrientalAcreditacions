import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface SettingsData {
  auto_assign_codes: boolean;
  auto_send_emails: boolean;
}

async function fetchSettings(): Promise<SettingsData> {
  const res = await fetch(`${API_URL}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

async function updateSettings(settings: SettingsData): Promise<SettingsData> {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

async function fetchSheetsStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_URL}/api/sheets/status`);
  if (!res.ok) return { configured: false };
  return res.json();
}

async function syncToSheets(): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/api/sheets/sync`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Sync failed');
  }
  return res.json();
}

function Toggle({
  enabled,
  onChange,
  disabled
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`
        relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          inline-block h-4 w-4 transform rounded-full bg-white transition-transform
          ${enabled ? 'translate-x-6' : 'translate-x-1'}
        `}
      />
    </button>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<SettingsData>({
    auto_assign_codes: false,
    auto_send_emails: false,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });

  const { data: sheetsStatus } = useQuery({
    queryKey: ['sheets-status'],
    queryFn: fetchSheetsStatus,
  });

  const syncMutation = useMutation({
    mutationFn: syncToSheets,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const handleToggle = (key: keyof SettingsData, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    mutation.mutate(newSettings);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Carregant configuració...
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuració</h2>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Automatització</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-700">Assignació automàtica de codis</p>
                <p className="text-sm text-gray-500">
                  Quan es rebi una nova acreditació, assignar automàticament un codi del pool
                </p>
              </div>
              <Toggle
                enabled={localSettings.auto_assign_codes}
                onChange={(value) => handleToggle('auto_assign_codes', value)}
                disabled={mutation.isPending}
              />
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-700">Enviament automàtic d'emails</p>
                  <p className="text-sm text-gray-500">
                    Enviar automàticament l'email amb el codi després d'assignar-lo
                  </p>
                  {localSettings.auto_send_emails && !localSettings.auto_assign_codes && (
                    <p className="text-sm text-amber-600 mt-1">
                      Activa també l'assignació automàtica per a un procés completament automàtic
                    </p>
                  )}
                </div>
                <Toggle
                  enabled={localSettings.auto_send_emails}
                  onChange={(value) => handleToggle('auto_send_emails', value)}
                  disabled={mutation.isPending}
                />
              </div>
            </div>
          </div>
        </div>

        {localSettings.auto_assign_codes && localSettings.auto_send_emails && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              Mode completament automàtic activat. Les noves acreditacions rebran automàticament un codi i l'email corresponent.
            </p>
          </div>
        )}

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">
              Error guardant la configuració. Torna-ho a provar.
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">Google Sheets</h3>

          {sheetsStatus?.configured ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-sm text-gray-600">Connectat</span>
              </div>
              <p className="text-sm text-gray-500">
                Les noves acreditacions es sincronitzen automàticament amb Google Sheets.
              </p>
              <button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {syncMutation.isPending ? 'Sincronitzant...' : 'Sincronitzar ara'}
              </button>
              {syncMutation.isSuccess && (
                <p className="text-sm text-green-600">Sincronització completada</p>
              )}
              {syncMutation.isError && (
                <p className="text-sm text-red-600">
                  Error: {(syncMutation.error as Error).message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                <span className="text-sm text-gray-600">No configurat</span>
              </div>
              <p className="text-sm text-gray-500">
                Configura les credencials de Google Sheets al servidor per activar la sincronització.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

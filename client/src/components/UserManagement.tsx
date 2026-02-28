import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/users';
import type { User, AccreditationType } from '../types';

const ALL_TYPES: AccreditationType[] = ['premsa', 'professional', 'nitoman'];

const TYPE_DISPLAY_NAMES: Record<AccreditationType, string> = {
  premsa: 'Premsa',
  professional: 'Professional',
  nitoman: 'Nitoman',
};

interface UserFormData {
  username: string;
  email: string;
  password: string;
  is_admin: boolean;
  types: AccreditationType[];
}

function UserForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  isEdit,
}: {
  initialData?: Partial<UserFormData>;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  isEdit?: boolean;
}) {
  const [username, setUsername] = useState(initialData?.username || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(initialData?.is_admin || false);
  const [types, setTypes] = useState<AccreditationType[]>(initialData?.types || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      username,
      email,
      password,
      is_admin: isAdmin,
      types,
    });
  };

  const toggleType = (type: AccreditationType) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom d'usuari
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contrasenya {isEdit && '(deixar en blanc per mantenir)'}
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={!isEdit}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipus d'acreditacions
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                types.includes(type)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {TYPE_DISPLAY_NAMES[type]}
            </button>
          ))}
        </div>
        {types.length === 0 && (
          <p className="text-sm text-red-500 mt-1">Selecciona almenys un tipus</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isAdmin"
          checked={isAdmin}
          onChange={(e) => setIsAdmin(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-700">
          Administrador (accés a tots els tipus i gestió d'usuaris)
        </label>
      </div>

      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          disabled={isLoading || types.length === 0}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Guardant...' : isEdit ? 'Actualitzar' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel·lar
        </button>
      </div>
    </form>
  );
}

export default function UserManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
    },
    onError: (err: Error) => alert(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (err: Error) => alert(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => alert(err.message),
  });

  const handleCreate = (data: UserFormData) => {
    if (data.types.length === 0) return;
    createMutation.mutate(data);
  };

  const handleUpdate = (data: UserFormData) => {
    if (!editingUser || data.types.length === 0) return;
    const updateData: any = {
      username: data.username,
      email: data.email,
      is_admin: data.is_admin,
      types: data.types,
    };
    if (data.password) {
      updateData.password = data.password;
    }
    updateMutation.mutate({ id: editingUser.id, data: updateData });
  };

  const handleDelete = (user: User) => {
    if (confirm(`Segur que vols eliminar l'usuari ${user.username}?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const handleToggleActive = (user: User) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    });
  };

  if (isLoading) {
    return <div className="text-gray-500">Carregant usuaris...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Gestió d'Usuaris</h2>
        {!showForm && !editingUser && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Nou Usuari
          </button>
        )}
      </div>

      {(showForm || editingUser) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">
            {editingUser ? 'Editar Usuari' : 'Nou Usuari'}
          </h3>
          <UserForm
            initialData={editingUser || undefined}
            onSubmit={editingUser ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            isEdit={!!editingUser}
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Usuari
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Tipus
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Rol
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Estat
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                Accions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="font-medium text-gray-900">{user.username}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1">
                    {user.is_admin ? (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        Tots
                      </span>
                    ) : (
                      user.types.map((type) => (
                        <span
                          key={type}
                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                        >
                          {TYPE_DISPLAY_NAMES[type]}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {user.is_admin ? (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      Admin
                    </span>
                  ) : (
                    <span className="text-sm text-gray-600">Usuari</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleToggleActive(user)}
                    className={`px-2 py-1 text-xs rounded ${
                      user.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.is_active ? 'Actiu' : 'Inactiu'}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Outlet, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import type { AccreditationType } from '../../types';

export default function AppLayout() {
  const { type } = useParams<{ type: AccreditationType }>();

  return (
    <div
      className="app-shell"
      data-current-type={type ?? undefined}
    >
      <Sidebar />
      <div className="main-col">
        <Header />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

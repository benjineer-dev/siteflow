'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';

export default function ProjectsPage() {
  const router = useRouter();

  const {
    user,
    isLoading,
    logout,
  } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, router, user]);

  function handleLogout(): void {
    logout();
    router.replace('/login');
  }

  if (isLoading || !user) {
    return (
      <main className="page-loading">
        <div className="spinner" />
        <span>Session Check</span>
      </main>
    );
  }

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <span className="brand-mark">SF</span>
          <span>SiteFlow</span>
        </div>

        <div className="user-menu">
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={handleLogout}
          >
            Exit
          </button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              Workspace
            </span>

            <h1>Projects</h1>

            <p>
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Modi rerum reprehenderit recusandae asperiores est. Temporibus nemo vitae rerum iusto totam, amet laboriosam velit quia labore quae. Eos facere excepturi aspernatur!
            </p>
          </div>

          <button
            className="primary-button compact"
            type="button"
          >
            Create Project
          </button>
        </div>

        <div className="empty-state">
          <div className="empty-icon">＋</div>

          <h2>Empty</h2>

          <p>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Commodi, culpa harum! A aliquam nemo tempore ipsum ipsa. Illum, qui. Consequatur, minus labore debitis nulla sit doloremque! Iure voluptatem officiis debitis?
          </p>
        </div>
      </section>
    </main>
  );
}
import { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { BottomTabBar } from './BottomTabBar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <NavBar />
      <main className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </main>
      <BottomTabBar />
    </div>
  );
}

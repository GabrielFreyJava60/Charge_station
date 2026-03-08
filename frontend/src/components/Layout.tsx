import React from 'react';
import Navbar from '@/components/Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Navbar />
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: 24 }}>
        {children}
      </main>
    </div>
  )
}

import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="relative min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-vaporwave-dark/50 border-b-2 border-neon-cyan">
        <div className="container mx-auto px-4 py-4">
          <h1
            className="text-2xl md:text-3xl font-pixel text-center text-neon-pink text-shadow-neon"
            data-text="知ってそうで知らないエンジニアクイズ"
          >
            知ってそうで知らないエンジニアクイズ
          </h1>
          <p className="text-center text-neon-cyan text-sm mt-2">
            Engineer's Hidden Knowledge Quiz
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 backdrop-blur-sm bg-vaporwave-dark/50 border-t-2 border-neon-purple">
        <div className="container mx-auto px-4 py-3">
          <p className="text-center text-xs text-neon-cyan/70">
            「知ってた？」を「知らなかった！」に変える学びの場
          </p>
        </div>
      </footer>
    </div>
  );
}

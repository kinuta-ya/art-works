import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
}: ButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      className={clsx(
        'px-6 py-3 font-bold rounded-lg border-2 transition-all',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-neon-pink border-neon-pink text-white hover:shadow-lg hover:shadow-neon-pink/50':
            variant === 'primary' && !disabled,
          'bg-transparent border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10':
            variant === 'secondary' && !disabled,
        }
      )}
    >
      {children}
    </motion.button>
  );
}

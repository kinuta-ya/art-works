import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="w-full h-4 bg-vaporwave-dark/50 rounded-full border-2 border-neon-cyan overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          boxShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
        }}
      />
    </div>
  );
}

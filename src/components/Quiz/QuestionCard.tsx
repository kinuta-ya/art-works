import { motion } from 'framer-motion';
import clsx from 'clsx';
import { useQuizStore } from '../../store/quizStore';
import type { Question } from '../../types';

interface QuestionCardProps {
  question: Question;
  showExplanation: boolean;
  onToggleExplanation: () => void;
}

export default function QuestionCard({
  question,
  showExplanation,
  onToggleExplanation,
}: QuestionCardProps) {
  const { answers, answerQuestion } = useQuizStore();
  const selectedAnswer = answers[question.id];

  const handleChoiceSelect = (choiceId: string) => {
    answerQuestion(question.id, choiceId);
  };

  return (
    <div className="card-neon">
      {/* Question Text */}
      <h2 className="text-xl md:text-2xl text-white font-bold mb-6">
        {question.question}
      </h2>

      {/* Choices */}
      {question.type === 'multiple-choice' && question.choices && (
        <div className="space-y-3 mb-6">
          {question.choices.map((choice) => {
            const isSelected = selectedAnswer === choice.id;
            const isCorrect = choice.id === question.correctAnswer;
            const showCorrectAnswer = showExplanation && isCorrect;
            const showWrongAnswer = showExplanation && isSelected && !isCorrect;

            return (
              <motion.button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice.id)}
                disabled={showExplanation}
                whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                whileTap={{ scale: showExplanation ? 1 : 0.98 }}
                className={clsx(
                  'w-full p-4 rounded-lg border-2 text-left transition-all',
                  'hover:shadow-lg',
                  {
                    'border-neon-cyan bg-neon-cyan/20': isSelected && !showExplanation,
                    'border-white/30 bg-white/5': !isSelected && !showExplanation,
                    'border-green-500 bg-green-500/20': showCorrectAnswer,
                    'border-red-500 bg-red-500/20': showWrongAnswer,
                    'cursor-not-allowed opacity-60': showExplanation && !showCorrectAnswer && !showWrongAnswer,
                  }
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold',
                      {
                        'border-neon-cyan text-neon-cyan': isSelected && !showExplanation,
                        'border-white/50 text-white/50': !isSelected && !showExplanation,
                        'border-green-500 text-green-500': showCorrectAnswer,
                        'border-red-500 text-red-500': showWrongAnswer,
                      }
                    )}
                  >
                    {choice.id.toUpperCase()}
                  </span>
                  <span className="text-white">{choice.text}</span>
                  {showCorrectAnswer && (
                    <span className="ml-auto text-green-500">✓</span>
                  )}
                  {showWrongAnswer && (
                    <span className="ml-auto text-red-500">✗</span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Show Explanation Button */}
      {selectedAnswer && !showExplanation && (
        <button
          onClick={onToggleExplanation}
          className="w-full py-3 px-6 bg-neon-purple/30 border-2 border-neon-purple rounded-lg text-neon-purple font-bold hover:bg-neon-purple/50 transition-all"
        >
          解説を見る
        </button>
      )}

      {/* Explanation */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-6 p-4 bg-vaporwave-purple/50 rounded-lg border-2 border-neon-pink"
        >
          <h3 className="text-neon-pink font-bold mb-2 flex items-center gap-2">
            <span>💡</span>
            解説
          </h3>
          <p className="text-white leading-relaxed">{question.explanation}</p>

          {question.tags && question.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-vaporwave-dark/50 rounded text-xs text-neon-cyan"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

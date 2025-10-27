import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useQuizStore } from '../../store/quizStore';
import QuestionCard from './QuestionCard';
import ProgressBar from '../UI/ProgressBar';
import Button from '../UI/Button';

export default function Quiz() {
  const {
    questions,
    currentQuestionIndex,
    answers,
    nextQuestion,
    previousQuestion,
    completeQuiz,
  } = useQuizStore();

  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion?.id];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleNext = () => {
    if (currentAnswer === currentQuestion.correctAnswer) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }

    if (currentQuestionIndex === questions.length - 1) {
      completeQuiz();
    } else {
      setShowExplanation(false);
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    setShowExplanation(false);
    previousQuestion();
  };

  if (!currentQuestion) {
    return (
      <div className="card-neon text-center">
        <p className="text-neon-cyan">問題を読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <div className="space-y-6">
        {/* Progress */}
        <ProgressBar progress={progress} />

        {/* Question Number */}
        <div className="flex justify-between items-center">
          <span className="text-neon-cyan font-pixel text-sm">
            Question {currentQuestionIndex + 1}/{questions.length}
          </span>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-neon-purple/30 border border-neon-purple rounded text-xs text-neon-purple">
              {currentQuestion.difficulty}
            </span>
            <span className="px-3 py-1 bg-neon-cyan/30 border border-neon-cyan rounded text-xs text-neon-cyan">
              {currentQuestion.category}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <QuestionCard
              question={currentQuestion}
              showExplanation={showExplanation}
              onToggleExplanation={() => setShowExplanation(!showExplanation)}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="secondary"
          >
            ← 前へ
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer}
            variant="primary"
          >
            {currentQuestionIndex === questions.length - 1 ? '完了' : '次へ →'}
          </Button>
        </div>
      </div>
    </>
  );
}

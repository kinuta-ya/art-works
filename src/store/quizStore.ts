import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizState, Question, UserProgress } from '../types';

interface QuizStore extends QuizState {
  questions: Question[];
  userProgress: UserProgress;

  // Actions
  setQuestions: (questions: Question[]) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  completeQuiz: () => void;
  resetQuiz: () => void;
  updateProgress: (questionId: string, isCorrect: boolean) => void;
}

const initialProgress: UserProgress = {
  totalQuestions: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  byCategory: {
    web: { total: 0, correct: 0 },
    infrastructure: { total: 0, correct: 0 },
    network: { total: 0, correct: 0 },
    application: { total: 0, correct: 0 },
  },
  byDifficulty: {
    beginner: { total: 0, correct: 0 },
    intermediate: { total: 0, correct: 0 },
    advanced: { total: 0, correct: 0 },
  },
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set, get) => ({
      currentQuestionIndex: 0,
      answers: {},
      score: 0,
      isComplete: false,
      questions: [],
      userProgress: initialProgress,

      setQuestions: (questions) => set({ questions }),

      answerQuestion: (questionId, answer) => {
        const { answers } = get();
        set({ answers: { ...answers, [questionId]: answer } });
      },

      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },

      completeQuiz: () => {
        const { questions, answers } = get();
        let score = 0;

        questions.forEach((question) => {
          const userAnswer = answers[question.id];
          if (userAnswer === question.correctAnswer) {
            score++;
          }
        });

        set({
          score,
          isComplete: true,
          endTime: Date.now()
        });
      },

      resetQuiz: () => {
        set({
          currentQuestionIndex: 0,
          answers: {},
          score: 0,
          isComplete: false,
          startTime: Date.now(),
          endTime: undefined,
        });
      },

      updateProgress: (questionId, isCorrect) => {
        const { questions, userProgress } = get();
        const question = questions.find(q => q.id === questionId);

        if (!question) return;

        const newProgress = { ...userProgress };
        newProgress.totalQuestions++;

        if (isCorrect) {
          newProgress.correctAnswers++;
        } else {
          newProgress.incorrectAnswers++;
        }

        // Update by category
        newProgress.byCategory[question.category].total++;
        if (isCorrect) {
          newProgress.byCategory[question.category].correct++;
        }

        // Update by difficulty
        newProgress.byDifficulty[question.difficulty].total++;
        if (isCorrect) {
          newProgress.byDifficulty[question.difficulty].correct++;
        }

        set({ userProgress: newProgress });
      },
    }),
    {
      name: 'quiz-storage',
      partialize: (state) => ({
        userProgress: state.userProgress,
      }),
    }
  )
);

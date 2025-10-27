export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type Category = 'web' | 'infrastructure' | 'network' | 'application';

export type QuestionType = 'multiple-choice' | 'text-input';

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  category: Category;
  difficulty: Difficulty;
  question: string;
  choices?: Choice[];
  correctAnswer: string;
  explanation: string;
  tags?: string[];
}

export interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  score: number;
  isComplete: boolean;
  startTime?: number;
  endTime?: number;
}

export interface UserProgress {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  byCategory: Record<Category, {
    total: number;
    correct: number;
  }>;
  byDifficulty: Record<Difficulty, {
    total: number;
    correct: number;
  }>;
}

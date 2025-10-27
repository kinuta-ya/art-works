import { useEffect } from 'react';
import { useQuizStore } from './store/quizStore';
import { questions } from './data/questions';
import Layout from './components/Layout/Layout';
import Quiz from './components/Quiz/Quiz';

function App() {
  const setQuestions = useQuizStore((state) => state.setQuestions);
  const isComplete = useQuizStore((state) => state.isComplete);

  useEffect(() => {
    setQuestions(questions);
  }, [setQuestions]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {!isComplete ? (
            <Quiz />
          ) : (
            <div className="card-neon text-center">
              <h2 className="text-4xl font-pixel text-neon-pink mb-6">
                クイズ完了！
              </h2>
              <p className="text-xl text-neon-cyan mb-8">
                お疲れ様でした
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from './components/QuestionForm';
import PaperDisplay from './components/PaperDisplay';
import AuthPages from './components/AuthPages';
import Background from './components/Background';
import History from './components/History';
import Solver from './components/Solver';
import { Sparkles, Loader2, LogOut, Clock, Brain } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function AppContent() {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // App State
    const [syllabus, setSyllabus] = useState('');
    const [count, setCount] = useState(5);
    const [difficulty, setDifficulty] = useState('medium');
    const [type, setType] = useState('mix');
    const [file, setFile] = useState(null);
    const [questions, setQuestions] = useState(null);
    const [genLoading, setGenLoading] = useState(false);
    const [error, setError] = useState(null);

    // Navigation State
    const [view, setView] = useState('generator'); // generator, history, solver
    const [historyPaper, setHistoryPaper] = useState(null);

    const location = useLocation();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setQuestions(null);
        setView('generator');
    };

    const generatePaper = async (e) => {
        e.preventDefault();
        setGenLoading(true);
        setError(null);
        setQuestions(null);

        const token = localStorage.getItem('token');

        try {

            const formData = new FormData();
            formData.append('syllabus', syllabus);

            if (file) {
                formData.append('file', file);
            } else {
                formData.append('count', parseInt(count));
                formData.append('difficulty', difficulty);
                formData.append('type', type);
            }

            const response = await axios.post('/api/generate-paper', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setQuestions(response.data.questions);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
            const errorMsg = err.response?.data?.error || err.message || 'Failed to generate paper. Please try again.';
            setError(errorMsg);
        } finally {
            setGenLoading(false);
        }
    };

    const reset = () => {
        setQuestions(null);
        setError(null);
        setHistoryPaper(null);
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading...</div>;

    return (
        <div>
            <Background />

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 className="title" style={{ margin: 0, fontSize: '2.5rem', textAlign: 'left' }}>
                    <Sparkles size={32} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '1rem' }} />
                    ExamGen AI
                </h1>
                {isAuthenticated && (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => { setView('solver'); reset(); }}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: view === 'solver' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
                        >
                            <Brain size={16} /> Solver
                        </button>

                        <button
                            onClick={() => { setView('generator'); reset(); }}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: view === 'generator' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
                        >
                            <Sparkles size={16} /> Generator
                        </button>

                        <button
                            onClick={() => { setView('history'); reset(); }}
                            className="btn-primary"
                            style={{ width: 'auto', padding: '0.5rem 1rem', background: view === 'history' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
                        >
                            <Clock size={16} /> History
                        </button>
                        <button onClick={logout} className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/auth" element={
                        !isAuthenticated ? <AuthPages setAuth={setIsAuthenticated} /> : <Navigate to="/" />
                    } />

                    <Route path="/" element={
                        isAuthenticated ? (
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                {view === 'history' ? (
                                    !historyPaper ? (
                                        <History
                                            onBack={() => setView('generator')}
                                            setViewPaper={setHistoryPaper}
                                        />
                                    ) : (
                                        <div className="glass-card">
                                            <PaperDisplay
                                                syllabus={historyPaper.syllabus}
                                                questions={typeof historyPaper.questions === 'string' ? JSON.parse(historyPaper.questions) : historyPaper.questions}
                                                reset={() => setHistoryPaper(null)}
                                            />
                                        </div>
                                    )
                                ) : view === 'solver' ? (
                                    <Solver />
                                ) : (
                                    <div className="glass-card">
                                        {!questions ? (
                                            <QuestionForm
                                                syllabus={syllabus}
                                                setSyllabus={setSyllabus}
                                                count={count}
                                                setCount={setCount}
                                                difficulty={difficulty}
                                                setDifficulty={setDifficulty}
                                                type={type}
                                                setType={setType}
                                                file={file}
                                                setFile={setFile}
                                                generatePaper={generatePaper}
                                                loading={genLoading}
                                            />
                                        ) : (
                                            <PaperDisplay
                                                syllabus={syllabus}
                                                questions={questions}
                                                reset={reset}
                                            />
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div style={{ color: '#ef4444', marginTop: '1rem', textAlign: 'center' }}>
                                        {error}
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <Navigate to="/auth" />
                        )
                    } />
                </Routes>
            </AnimatePresence>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;

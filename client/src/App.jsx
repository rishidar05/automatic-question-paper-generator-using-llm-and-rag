import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import QuestionForm from './components/QuestionForm';
import PaperDisplay from './components/PaperDisplay';
import LoginPage from './components/LoginPage';
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
    const [count, setCount] = useState('');
    const [difficulty, setDifficulty] = useState('medium');
    const [type, setType] = useState('auto');
    const [file, setFile] = useState(null);
    const [patternFile, setPatternFile] = useState(null);
    const [questions, setQuestions] = useState(null);
    const [paperMetadata, setPaperMetadata] = useState(null);
    const [genLoading, setGenLoading] = useState(false);
    const [error, setError] = useState(null);

    // Navigation State
    const [view, setView] = useState('generator'); // generator, history, solver
    const [historyPaper, setHistoryPaper] = useState(null);

    const location = useLocation();

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    console.log("Verifying existing token...");
                    await axios.get('/api/verify', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error('Token verification failed', err);
                    localStorage.removeItem('token');
                    setIsAuthenticated(false);
                }
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        };
        verifyToken();
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
            formData.append('count', parseInt(count));
            formData.append('difficulty', difficulty);
            formData.append('type', type);

            if (file) {
                formData.append('file', file);
            }
            if (patternFile) {
                formData.append('patternFile', patternFile);
            }

            const response = await axios.post('/api/generate-paper', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setQuestions(response.data.questions);
            setPaperMetadata(response.data.paper_metadata || null);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
            }
            const errorMsg = err.response?.data?.error || err.message || 'Failed to generate paper. Please try again.';
            const details = err.response?.data?.details ? ` (${err.response.data.details})` : '';
            setError(`${errorMsg}${details}`);
        } finally {
            setGenLoading(false);
        }
    };

    const reset = () => {
        setQuestions(null);
        setPaperMetadata(null);
        setError(null);
        setHistoryPaper(null);
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading...</div>;

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Background />

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                <h1 
                    className="title" 
                    onClick={() => { setView('generator'); reset(); }}
                    style={{ margin: 0, fontSize: '2.5rem', textAlign: 'left', cursor: 'pointer' }}
                >
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
                    <Route path="/login" element={
                        !isAuthenticated ? <LoginPage setAuth={setIsAuthenticated} /> : <Navigate to="/" />
                    } />

                    <Route path="/" element={
                        isAuthenticated ? (
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
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
                                    <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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
                                                patternFile={patternFile}
                                                setPatternFile={setPatternFile}
                                                generatePaper={generatePaper}
                                                loading={genLoading}
                                            />
                                        ) : (
                                            <PaperDisplay
                                                syllabus={syllabus}
                                                questions={questions}
                                                paperMetadata={paperMetadata}
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
                            <Navigate to="/login" />
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

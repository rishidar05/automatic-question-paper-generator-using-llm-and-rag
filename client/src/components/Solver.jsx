import { useState } from 'react';
import axios from 'axios';
import { Loader2, Brain, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Solver = () => {
    const [input, setInput] = useState('');
    const [solution, setSolution] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSolve = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSolution(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setSolution("Please login to use this feature.");
                return;
            }

            const res = await axios.post('/api/solve', {
                text: input
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSolution(res.data.solution);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setSolution("Session expired. Please logout and login again.");
            } else {
                setSolution(err.response?.data?.error || "Failed to solve. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card"
        >
            <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                <Brain size={32} style={{ marginRight: '10px', verticalAlign: 'middle', color: '#a78bfa' }} />
                Smart Solver
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                Paste any question or list of questions below. AI will provide the answers.
            </p>

            <form onSubmit={handleSolve}>
                <textarea
                    className="input-field"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="e.g. Define Photosynthesis. What is the speed of light?"
                    rows={6}
                    style={{ minHeight: '150px', marginBottom: '1.5rem', resize: 'vertical' }}
                    required
                />

                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? <><Loader2 className="animate-spin" /> Solving...</> : 'Get Answers'}
                </button>
            </form>

            {solution && (
                <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', color: '#4ade80', marginBottom: '1rem' }}>
                        <CheckCircle size={20} style={{ marginRight: '8px' }} /> Solution
                    </h3>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#e2e8f0' }}>
                        {solution}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default Solver;

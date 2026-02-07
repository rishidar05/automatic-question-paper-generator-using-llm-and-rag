import { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Calendar, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const History = ({ onBack, setViewPaper }) => {
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.get('/api/history', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPapers(res.data);
            } catch (err) {
                setError('Failed to load history');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div style={{ color: 'white', textAlign: 'center' }}><Loader2 className="animate-spin" /> Loading History...</div>;
    if (error) return <div style={{ color: '#ef4444', textAlign: 'center' }}>{error}</div>;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-card"
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', marginRight: '1rem' }}>
                    <ArrowLeft size={24} />
                </button>
                <h2 className="title" style={{ margin: 0, fontSize: '1.8rem' }}>History</h2>
            </div>

            {papers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8' }}>No papers generated yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {papers.map(paper => (
                        <div
                            key={paper.id}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1.5rem',
                                borderRadius: '1rem',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setViewPaper(paper)}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{paper.syllabus}</h3>
                                    <span style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Calendar size={12} /> {new Date(paper.created_at).toLocaleDateString()}
                                        {new Date(paper.created_at).toLocaleTimeString()}
                                    </span>
                                </div>
                                <span style={{ background: 'var(--primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                    {(typeof paper.questions === 'string' ? JSON.parse(paper.questions) : paper.questions).length} Qs
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

export default History;

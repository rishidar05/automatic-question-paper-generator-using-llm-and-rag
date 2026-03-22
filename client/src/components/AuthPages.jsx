import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Mail, User, ShieldCheck } from 'lucide-react';

const AuthPages = ({ setAuth }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState('auth'); // auth, otp
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const endpoint = isLogin ? '/api/login' : '/api/signup';
            const res = await axios.post(endpoint, { email, password });

            if (res.data) {
                setStep('otp');
                // In real app we generally verify login, but here we enforce OTP for both
            }
        } catch (err) {
            console.error('Auth Error Details:', err);
            console.error('Response Data:', err.response?.data);
            setError(err.response?.data?.error || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // The server uses /api/verify-otp for both flows
            const res = await axios.post('/api/verify-otp', { email, otp });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                setAuth(true);
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <AnimatePresence mode='wait'>
                {step === 'auth' ? (
                    <motion.div
                        key="auth-form"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                            {isLogin ? 'Welcome Back' : 'Join Us'}
                        </h2>

                        <form onSubmit={handleAuth}>
                            <div className="input-group">
                                <label className="label">
                                    <Mail size={14} style={{ display: 'inline', marginRight: 5 }} /> Email
                                </label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label className="label">
                                    <Lock size={14} style={{ display: 'inline', marginRight: 5 }} /> Password
                                </label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            {error && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                            </button>
                        </form>

                        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                {isLogin ? 'Sign Up' : 'Login'}
                            </button>
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        key="otp-form"
                        initial={{ x: 100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="glass-card"
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        <h2 className="title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Verify OTP</h2>
                        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#94a3b8' }}>
                            Check your email for the OTP code.
                        </p>

                        <form onSubmit={handleVerify}>
                            <div className="input-group">
                                <label className="label">
                                    <ShieldCheck size={14} style={{ display: 'inline', marginRight: 5 }} /> OTP Code
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    placeholder="123456"
                                    required
                                />
                            </div>

                            {error && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuthPages;

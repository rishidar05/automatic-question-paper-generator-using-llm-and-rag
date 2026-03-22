import { FileText, Hash, Loader2, Sparkles, Upload, X, Database, Settings, BookOpen, SlidersHorizontal, Target } from 'lucide-react';

const QuestionForm = ({ syllabus, setSyllabus, count, setCount, difficulty, setDifficulty, type, setType, file, setFile, patternFile, setPatternFile, generatePaper, loading }) => {
    return (
        <form onSubmit={generatePaper} style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>

            {/* Section 1: Data Sources */}
            <div>
                <h3 style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', marginBottom: '0.75rem'
                }}>
                    <Database size={18} color="var(--primary)" /> Data Sources
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

                    {/* Syllabus Upload */}
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="label" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <BookOpen size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Syllabus File (Mandatory)
                        </label>

                        {!file ? (
                            <div style={{
                                border: '1px dashed rgba(255,255,255,0.15)', padding: '1.25rem 1rem',
                                borderRadius: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.2)',
                                transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative'
                            }}>
                                <Upload size={20} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                                <input
                                    type="file"
                                    accept=".txt,.pdf,.docx"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        opacity: 0, cursor: 'pointer'
                                    }}
                                    required
                                />
                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Click to upload or drag & drop</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBotom: 0 }}>
                                    TXT, PDF, DOCX
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1) /* emerald */',
                                padding: '1rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(16, 185, 129, 0.25)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                        <FileText size={18} color="#10b981" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#10b981' }}>{file.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Ready for processing</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFile(null)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}
                                >
                                    <X size={14} /> Remove
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pattern Upload */}
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="label" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                            <Target size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Sample Paper Pattern (Optional)
                        </label>

                        {!patternFile ? (
                            <div style={{
                                border: '1px dashed rgba(255,255,255,0.15)', padding: '1.25rem 1rem',
                                borderRadius: '10px', textAlign: 'center', background: 'rgba(0,0,0,0.2)',
                                transition: 'all 0.3s ease', cursor: 'pointer', position: 'relative'
                            }}>
                                <Upload size={20} color="var(--text-secondary)" style={{ marginBottom: '0.5rem' }} />
                                <input
                                    type="file"
                                    accept=".txt,.pdf,.docx"
                                    onChange={(e) => setPatternFile(e.target.files[0])}
                                    style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        opacity: 0, cursor: 'pointer'
                                    }}
                                />
                                <div style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-primary)' }}>Click to upload or drag & drop</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', marginBotom: 0 }}>
                                    Match this document's structure
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                background: 'rgba(56, 189, 248, 0.1) /* sky blue */',
                                padding: '1rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid rgba(56, 189, 248, 0.25)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                    <div style={{ background: 'rgba(56, 189, 248, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                                        <FileText size={18} color="#38bdf8" />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#38bdf8' }}>{patternFile.name}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>Structure loaded</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPatternFile(null)}
                                    style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}
                                >
                                    <X size={14} /> Remove
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Generation Settings */}
            <div>
                <h3 style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', marginBottom: '0.75rem'
                }}>
                    <Settings size={18} color="var(--primary)" /> Configuration
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    {/* Count */}
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="label" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                            <Hash size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Question Count
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            min="0"
                            max="100"
                            placeholder="Auto (match pattern)"
                            style={{ fontSize: '0.95rem', padding: '0.75rem 1rem' }}
                        />
                    </div>

                    {/* Difficulty */}
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="label" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                            <SlidersHorizontal size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Difficulty Level
                        </label>
                        <select
                            className="input-field"
                            value={difficulty}
                            onChange={e => setDifficulty(e.target.value)}
                            style={{ fontSize: '0.95rem', padding: '0.75rem 1rem', appearance: 'none' }}
                        >
                            <option value="easy">Level 1 - Easy</option>
                            <option value="medium">Level 2 - Medium</option>
                            <option value="hard">Level 3 - Hard</option>
                        </select>
                    </div>

                    {/* Type */}
                    <div className="input-group" style={{ margin: 0 }}>
                        <label className="label" style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                            <Target size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                            Question Format
                        </label>
                        <select
                            className="input-field"
                            value={type}
                            onChange={e => setType(e.target.value)}
                            style={{ fontSize: '0.95rem', padding: '0.75rem 1rem', appearance: 'none' }}
                        >
                            <option value="auto">Auto (Match Pattern)</option>
                            <option value="mix">Mix & Match</option>
                            <option value="mcq">MCQ Only</option>
                            <option value="short">Short Answer</option>
                            <option value="long">Long Essay</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div style={{ marginTop: '0.5rem' }}>
                <button
                    className="btn-primary"
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        fontWeight: '600',
                        borderRadius: '10px',
                        boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Initiating AI Engine...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} style={{ marginRight: '6px' }} /> Generate Question Paper
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default QuestionForm;

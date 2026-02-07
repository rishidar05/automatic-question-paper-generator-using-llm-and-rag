import { FileText, Hash, Loader2, Sparkles, Upload, X } from 'lucide-react';

const QuestionForm = ({ syllabus, setSyllabus, count, setCount, difficulty, setDifficulty, type, setType, file, setFile, generatePaper, loading }) => {
    return (
        <form onSubmit={generatePaper}>
            <div className="input-group">
                <label className="label">
                    <FileText size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                    Syllabus / Topics
                </label>
                <textarea
                    className="input-field"
                    value={syllabus}
                    onChange={(e) => setSyllabus(e.target.value)}
                    placeholder="e.g. Physics: Newton's Laws, Kinematics..."
                    rows={4}
                    style={{ resize: 'vertical' }}
                    required
                />
            </div>

            {/* File Upload Section */}
            <div className="input-group" style={{ marginTop: '1rem' }}>
                <label className="label">
                    <Upload size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                    Upload Format File (Optional)
                </label>

                {!file ? (
                    <div style={{ border: '1px dashed rgba(255,255,255,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                        <input
                            type="file"
                            accept=".txt,.pdf,.docx"
                            onChange={(e) => setFile(e.target.files[0])}
                            style={{ color: 'white' }}
                        />
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>
                            Upload .txt, .pdf, or .docx to define specific question format.
                            <br />
                            <span style={{ color: '#fbbf24' }}>This will override Count, Difficulty, and Type settings.</span>
                        </p>
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(16, 185, 129, 0.4)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} color="#10b981" />
                            {file.name}
                        </span>
                        <button
                            type="button"
                            onClick={() => setFile(null)}
                            style={{ background: 'transparent', border: 'none', color: '#fda4af', cursor: 'pointer' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>

            {!file && (
                <>
                    <div className="input-group">
                        <label className="label">
                            <Hash size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '5px' }} />
                            Number of Questions
                        </label>
                        <input
                            type="number"
                            className="input-field"
                            value={count}
                            onChange={(e) => setCount(e.target.value)}
                            min="1"
                            max="100"
                            required={!file}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                        <div>
                            <label className="label">Difficulty</label>
                            <select
                                className="input-field"
                                value={difficulty}
                                onChange={e => setDifficulty(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            >
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Type</label>
                            <select
                                className="input-field"
                                value={type}
                                onChange={e => setType(e.target.value)}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                            >
                                <option value="mix">Mix</option>
                                <option value="mcq">MCQ Only</option>
                                <option value="short">Short Answer</option>
                                <option value="long">Long Answer</option>
                            </select>
                        </div>
                    </div>
                </>
            )}

            <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '2rem' }}>
                {loading ? (
                    <>
                        <Loader2 className="animate-spin" /> Generating...
                    </>
                ) : (
                    <>
                        <Sparkles size={16} style={{ marginRight: '5px' }} /> Generate Question Paper
                    </>
                )}
            </button>
        </form>
    );
};

export default QuestionForm;

import React, { useRef, useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { Download, RefreshCcw, Edit2, Eye, EyeOff, FileText, Printer } from 'lucide-react';

const PaperDisplay = ({ syllabus, questions, reset }) => {
    const paperRef = useRef();

    // State
    const [qList, setQList] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);
    const [schoolName, setSchoolName] = useState('');
    const [examDate, setExamDate] = useState('');

    // Initialize qList from props (handle string array vs object array legacy)
    useEffect(() => {
        if (!questions) return;

        let parsed = questions;
        // Legacy string array fallback
        if (parsed.length > 0 && typeof parsed[0] === 'string') {
            parsed = parsed.map((q, i) => ({
                id: i,
                type: 'short',
                question: q,
                options: null,
                answer: '',
                difficulty: 'medium'
            }));
        }
        setQList(parsed);
    }, [questions]);

    const handleDownload = () => {
        const doc = new jsPDF();

        // Settings
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxLineWidth = pageWidth - margin * 2;
        let y = 20; // Start Y position

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolName || 'EXAMINATION PAPER', pageWidth / 2, y, { align: 'center' });
        y += 10;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(examDate || `Syllabus: ${syllabus}`, pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Line Divider
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Questions
        doc.setFontSize(11);

        qList.forEach((q, index) => {
            // Check for page break
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            // Question Text
            const questionPrefix = `${index + 1}. `;
            const marksSuffix = `   [${q.marks || (q.type === 'mcq' ? 1 : 5)}]`;

            doc.setFont('helvetica', 'bold');
            const splitQuestion = doc.splitTextToSize(questionPrefix + q.question + marksSuffix, maxLineWidth);
            doc.text(splitQuestion, margin, y);
            y += (splitQuestion.length * 6) + 2;

            // MCQ Options
            if (q.type === 'mcq' && q.options) {
                doc.setFont('helvetica', 'normal');
                q.options.forEach((opt, i) => {
                    if (y > 280) { doc.addPage(); y = 20; }
                    const optionText = `${String.fromCharCode(65 + i)}. ${opt}`;
                    const splitOption = doc.splitTextToSize(optionText, maxLineWidth - 10);
                    doc.text(splitOption, margin + 10, y);
                    y += (splitOption.length * 5) + 2;
                });
            }

            y += 5; // Spacing between questions
        });

        doc.save(`question-paper-${syllabus.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    };

    const handleDocxDownload = async () => {
        const children = [];

        // Title
        children.push(
            new Paragraph({
                text: schoolName || 'EXAMINATION PAPER',
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );

        children.push(
            new Paragraph({
                text: examDate || `Syllabus: ${syllabus}`,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );

        // Questions
        qList.forEach((q, index) => {
            // Question Text
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. ${q.question}`,
                            bold: true,
                            size: 24, // 12pt
                        }),
                        new TextRun({
                            text: `   [${q.marks || (q.type === 'mcq' ? 1 : 5)}]`,
                            bold: true,
                        })
                    ],
                    spacing: { before: 200, after: 100 }
                })
            );

            // MCQ Options
            if (q.type === 'mcq' && q.options) {
                q.options.forEach((opt, i) => {
                    children.push(
                        new Paragraph({
                            text: `${String.fromCharCode(65 + i)}. ${opt}`,
                            indent: { left: 720 }, // 0.5 inch
                            spacing: { after: 50 }
                        })
                    );
                });
            }

            // Space for answer
            children.push(new Paragraph({ text: "", spacing: { after: 200 } }));
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `question-paper-${syllabus.replace(/\s+/g, '-').toLowerCase()}.docx`);
    };

    const handleUpdateQuestion = (id, field, value) => {
        setQList(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    return (
        <div style={{ width: '100%' }}>
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button onClick={handleDocxDownload} className="btn-primary" style={{ width: 'auto', background: '#2563eb' }}>
                    <FileText size={16} style={{ marginRight: '5px' }} /> Download Word
                </button>
                <button onClick={handleDownload} className="btn-primary" style={{ width: 'auto' }}>
                    <Printer size={16} style={{ marginRight: '5px' }} /> Print / PDF
                </button>
                <button onClick={() => setEditMode(!editMode)} className="btn-primary" style={{ width: 'auto', background: editMode ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                    <Edit2 size={16} style={{ marginRight: '5px' }} /> {editMode ? 'Done Editing' : 'Edit Paper'}
                </button>
                <button onClick={() => setShowAnswers(!showAnswers)} className="btn-primary" style={{ width: 'auto', background: showAnswers ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
                    {showAnswers ? <EyeOff size={16} style={{ marginRight: '5px' }} /> : <Eye size={16} style={{ marginRight: '5px' }} />}
                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                </button>
                <button onClick={reset} className="btn-primary" style={{ width: 'auto', background: 'rgba(255,50,50,0.2)' }}>
                    <RefreshCcw size={16} style={{ marginRight: '5px' }} /> New
                </button>
            </div>

            {/* Paper Preview */}
            <div ref={paperRef} style={{ background: 'white', color: 'black', padding: '2rem', borderRadius: '4px', minHeight: '600px' }}>

                {/* Branding Headers */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '2px solid black', paddingBottom: '1rem' }}>
                    {editMode ? (
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                            <input
                                placeholder="School Name"
                                value={schoolName} onChange={e => setSchoolName(e.target.value)}
                                style={{ padding: '5px', border: '1px solid #ccc' }}
                            />
                            <input
                                placeholder="Date / Exam Name"
                                value={examDate} onChange={e => setExamDate(e.target.value)}
                                style={{ padding: '5px', border: '1px solid #ccc' }}
                            />
                        </div>
                    ) : (
                        <>
                            <h2 style={{ margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>{schoolName || 'EXAMINATION PAPER'}</h2>
                            <p style={{ margin: 0 }}>{examDate || `Syllabus: ${syllabus}`}</p>
                        </>
                    )}
                </div>

                {/* Questions */}
                <div style={{ textAlign: 'left' }}>
                    {qList.map((q, index) => (
                        <div key={q.id || index} style={{ marginBottom: '1.5rem', pageBreakInside: 'avoid' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
                                    <strong>{index + 1}.</strong>
                                    <div style={{ width: '100%' }}>
                                        {editMode ? (
                                            <textarea
                                                value={q.question}
                                                onChange={e => handleUpdateQuestion(q.id, 'question', e.target.value)}
                                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: '1.1rem' }}>{q.question}</span>
                                        )}

                                        {/* MCQ Options */}
                                        {q.type === 'mcq' && q.options && (
                                            <div style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                                                {q.options.map((opt, i) => (
                                                    <div key={i} style={{ marginBottom: '0.25rem' }}>
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Answers & Explanations */}
                                        {showAnswers && q.answer && (
                                            <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#166534', fontSize: '0.9rem' }}>
                                                <strong>Answer:</strong> {q.answer}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Mark / Actions */}
                                <div style={{ marginLeft: '1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <span style={{ fontWeight: 'bold' }}>[{q.marks || (q.type === 'mcq' ? 1 : 5)}]</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PaperDisplay;

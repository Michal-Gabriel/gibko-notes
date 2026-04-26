import { useEffect, useRef, useState } from 'react';
import { saveAs } from 'file-saver';

const STORAGE_KEY = 'gibko-notes-content';
const THEME_KEY = 'gibko-notes-theme';
const PLACEHOLDER = 'Start writing...';

function getStoredValue(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function formatReadingTime(words) {
  if (words === 0) {
    return '0 min read';
  }

  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function getTextMetrics(text) {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;

  return {
    words,
    characters: text.length,
    readingTime: formatReadingTime(words),
  };
}

export default function App() {
  const [text, setText] = useState(() => getStoredValue(STORAGE_KEY));
  const [theme, setTheme] = useState(() => getStoredValue(THEME_KEY, 'dark'));
  const [status, setStatus] = useState('');
  const [saveStatus, setSaveStatus] = useState(() => (getStoredValue(STORAGE_KEY) ? 'Saved locally' : ''));
  const editorRef = useRef(null);
  const statusTimerRef = useRef(null);
  const autosaveTimerRef = useRef(null);

  const metrics = getTextMetrics(text);
  const hasText = text.trim().length > 0;

  useEffect(() => {
    editorRef.current?.focus();
  }, []);

  useEffect(() => {
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      try {
        if (text) {
          localStorage.setItem(STORAGE_KEY, text);
          setSaveStatus('Saved locally');
        } else {
          localStorage.removeItem(STORAGE_KEY);
          setSaveStatus('');
        }
      } catch {
        setSaveStatus('Local save unavailable');
      }
    }, 220);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [text]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Ignore storage errors and still apply the theme locally.
    }
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(
    () => () => {
      if (statusTimerRef.current) {
        window.clearTimeout(statusTimerRef.current);
      }

      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    },
    [],
  );

  function flashStatus(message) {
    setStatus(message);

    if (statusTimerRef.current) {
      window.clearTimeout(statusTimerRef.current);
    }

    statusTimerRef.current = window.setTimeout(() => {
      setStatus('');
    }, 2400);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      flashStatus('Copied');
    } catch {
      flashStatus('Clipboard access failed.');
    }
  }

  function handleClear() {
    if (!window.confirm('Clear all text?')) {
      return;
    }

    setText('');
    editorRef.current?.focus();
    flashStatus('Editor cleared.');
  }

  function handleClearLocalNote() {
    if (!window.confirm('Remove this local note from this browser?')) {
      return;
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      flashStatus('Local note could not be removed.');
      return;
    }

    setText('');
    setSaveStatus('');
    editorRef.current?.focus();
    flashStatus('Local note cleared.');
  }

  function handleDownloadTxt() {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'gibko-notes.txt');
    flashStatus('TXT downloaded.');
  }

  async function handleExportPdf() {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 56;
    const bodyWidth = pageWidth - margin * 2;
    const lineHeight = 18;
    let y = margin;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Gibko Notes', margin, y);
    y += 30;

    pdf.setFont('times', 'normal');
    pdf.setFontSize(12);

    const paragraphs = (text || '').split('\n');

    paragraphs.forEach((paragraph) => {
      const lines = paragraph
        ? pdf.splitTextToSize(paragraph, bodyWidth)
        : [''];

      lines.forEach((line) => {
        if (y > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.text(line, margin, y);
        y += lineHeight;
      });

      y += 6;

      if (y > pageHeight - margin) {
        pdf.addPage();
        y = margin;
      }
    });

    const blob = pdf.output('blob');
    saveAs(blob, 'gibko-notes.pdf');
    flashStatus('PDF exported.');
  }

  async function handleExportDocx() {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              spacing: {
                after: 240,
              },
              children: [
                new TextRun({
                  text: 'Gibko Notes',
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            ...(text || '').split('\n').map(
              (line) =>
                new Paragraph({
                  spacing: {
                    after: 120,
                  },
                  children: [
                    new TextRun({
                      text: line || ' ',
                      size: 24,
                    }),
                  ],
                }),
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'gibko-notes.docx');
    flashStatus('DOCX exported.');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-[background-color,color] duration-500">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="rounded-[30px] border border-[var(--border)] bg-[var(--panel)] px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-7 sm:py-8">
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
                  Gibko Notes
                </p>
                <h1 className="mt-3 font-['Iowan_Old_Style','Palatino_Linotype',serif] text-4xl leading-none tracking-tight sm:text-5xl">
                  Gibko Notes
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Open. Write. Export.
                </p>
              </div>

              <ToolbarButton
                label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <ToolbarButton label="Copy" onClick={handleCopy} />
              <ToolbarButton label="Clear" onClick={handleClear} />
              <ToolbarButton label="Clear local note" onClick={handleClearLocalNote} disabled={!hasText} />
              <ToolbarButton label="Download TXT" onClick={handleDownloadTxt} disabled={!hasText} />
              <ToolbarButton label="Export PDF" onClick={handleExportPdf} disabled={!hasText} />
              <ToolbarButton label="Export DOCX" onClick={handleExportDocx} disabled={!hasText} />
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-5 py-5 sm:gap-6 sm:py-7">
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Words" value={metrics.words} />
            <StatCard label="Characters" value={metrics.characters} />
            <StatCard label="Reading time" value={metrics.readingTime} />
          </section>

          <section className="relative flex flex-1 flex-col overflow-hidden rounded-[34px] border border-[var(--border)] bg-[var(--panel)] shadow-[0_32px_90px_rgba(15,23,42,0.09)] backdrop-blur-xl">
            <div className="flex flex-col gap-2 border-b border-[var(--border)] px-5 py-4 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <span className="font-medium">Browser-based editor</span>
              <span className="min-h-5 text-left sm:text-right">{status || saveStatus || 'Private, local, and distraction-free.'}</span>
            </div>

            <textarea
              ref={editorRef}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              spellCheck="true"
              className="min-h-[54vh] flex-1 resize-none border-0 bg-transparent px-5 py-6 text-base leading-8 text-[var(--text)] outline-none transition-colors duration-300 placeholder:text-[var(--placeholder)] sm:min-h-[60vh] sm:px-6 sm:py-7 sm:text-lg"
            />
          </section>
        </main>

        <footer className="pt-2 pb-4 text-center text-sm leading-6 text-[var(--muted)] sm:pt-4">
          Gibko Notes — private by default. Nothing is uploaded.
        </footer>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--panel)]/92 px-4 py-4 shadow-[0_12px_36px_rgba(15,23,42,0.05)] backdrop-blur-xl sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-[1.75rem]">{value}</p>
    </div>
  );
}

function ToolbarButton({ disabled = false, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--button)] px-4 py-2 text-sm font-medium text-[var(--text)] shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:bg-[var(--button-hover)] hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)] disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--button-disabled)] disabled:text-[var(--muted-soft)] disabled:shadow-none"
    >
      {label}
    </button>
  );
}

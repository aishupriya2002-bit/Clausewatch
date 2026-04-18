'use client';
import { useState } from 'react';

const riskColors = {
  red: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    badge: 'bg-red-100 text-red-800',
    icon: '🚨',
    label: 'High Risk',
  },
  yellow: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    badge: 'bg-yellow-100 text-yellow-800',
    icon: '⚠️',
    label: 'Worth Questioning',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-300',
    badge: 'bg-green-100 text-green-800',
    icon: '✅',
    label: 'Standard',
  },
};

export default function Home() {
  const [contract, setContract] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!contract.trim() || contract.trim().length < 50) {
      setError('Please paste at least a paragraph of contract text.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contract }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError('Something went wrong: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const redCount = result?.clauses?.filter(c => c.risk === 'red').length || 0;
  const yellowCount = result?.clauses?.filter(c => c.risk === 'yellow').length || 0;
  const greenCount = result?.clauses?.filter(c => c.risk === 'green').length || 0;

  return (
    <main className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-bold">CW</div>
          <span className="text-lg font-semibold tracking-tight">ClauseWatch</span>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">AI-Powered Contract Scanner</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Is this contract trying to <span className="text-indigo-400">screw you?</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Paste any contract or clause. ClauseWatch flags unfair terms, explains the risks, and tells you what to push back on — in plain English.
          </p>
        </div>

        {/* Input */}
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-3">
            Paste your contract text
          </label>
          <textarea
            className="w-full bg-slate-800 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-500 text-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            rows={10}
            placeholder="Paste your employment contract, rental agreement, freelance contract, NDA, or any legal document here..."
            value={contract}
            onChange={e => setContract(e.target.value)}
          />
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">{contract.length} characters</span>
            <button
              onClick={analyze}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-xl transition text-sm"
            >
              {loading ? 'Analyzing...' : 'Analyze Contract →'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded-xl px-5 py-4 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-16 text-slate-400">
            <div className="text-4xl mb-4 animate-pulse">🔍</div>
            <p className="text-lg font-medium">Reading the fine print...</p>
            <p className="text-sm mt-2 text-slate-500">Identifying risky clauses and explaining them for you</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-1">Overall Assessment</h2>
              <p className="text-slate-400 text-sm mb-5">{result.summary}</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-950 border border-red-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{redCount}</div>
                  <div className="text-xs text-red-300 mt-1">High Risk</div>
                </div>
                <div className="bg-yellow-950 border border-yellow-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{yellowCount}</div>
                  <div className="text-xs text-yellow-300 mt-1">Worth Questioning</div>
                </div>
                <div className="bg-green-950 border border-green-800 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{greenCount}</div>
                  <div className="text-xs text-green-300 mt-1">Standard</div>
                </div>
              </div>
              {result.verdict && (
                <div className="mt-5 border-t border-slate-700 pt-4">
                  <p className="text-sm font-medium text-slate-300">
                    Verdict: <span className="text-indigo-300">{result.verdict}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Clauses */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Clause-by-Clause Breakdown</h2>
              <div className="space-y-4">
                {result.clauses?.map((clause, i) => {
                  const risk = riskColors[clause.risk] || riskColors.green;
                  return (
                    <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
                      <div className="px-5 py-4 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-base">{risk.icon}</span>
                            <span className="font-medium text-sm">{clause.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${risk.badge}`}>
                              {risk.label}
                            </span>
                            {clause.category && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                                {clause.category}
                              </span>
                            )}
                          </div>
                          {clause.original && (
                            <blockquote className="text-xs text-slate-400 italic border-l-2 border-slate-600 pl-3 mb-3 line-clamp-3">
                              "{clause.original}"
                            </blockquote>
                          )}
                          <p className="text-sm text-slate-300 leading-relaxed">{clause.explanation}</p>
                          {clause.advice && (
                            <p className="text-sm text-indigo-300 mt-2 font-medium">
                              💡 {clause.advice}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-xs text-slate-600 text-center pb-6">
              ClauseWatch is an AI tool and does not provide legal advice. For important contracts, consult a qualified lawyer.
            </div>
          </div>
        )}

        {/* Empty state tips */}
        {!result && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {[
              { icon: '🏠', label: 'Rental agreements', desc: 'Unfair eviction clauses, hidden charges' },
              { icon: '💼', label: 'Employment contracts', desc: 'Non-competes, IP grabs, termination terms' },
              { icon: '🤝', label: 'Freelance contracts', desc: 'Payment terms, IP ownership, liability' },
            ].map((tip, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-2xl mb-2">{tip.icon}</div>
                <div className="text-sm font-medium text-slate-300 mb-1">{tip.label}</div>
                <div className="text-xs text-slate-500">{tip.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
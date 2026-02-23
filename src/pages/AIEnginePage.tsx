import { useState, useCallback } from 'react';
import { getAIEngine } from '../ai/engine';
import { useAppContext } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AIModelMetrics } from '../types';

export default function AIEnginePage() {
  const { bugs } = useAppContext();
  const ai = getAIEngine();
  
  const [metrics, setMetrics] = useState<AIModelMetrics>(ai.getMetrics());
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<{ severity: string; confidence: number; scores: Record<string, number>; features: string[] } | null>(null);
  const [dupText, setDupText] = useState('');
  const [dupResults, setDupResults] = useState<{ bugId: string; bugTitle: string; score: number; method: string }[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);

  const handleRetrain = useCallback(async () => {
    setIsTraining(true);
    setTrainingLog(['[INFO] Initializing model retraining...', '[INFO] Loading training dataset...']);
    
    const newMetrics = await ai.retrain((epoch, loss, acc) => {
      setTrainingLog(prev => [...prev, `[Epoch ${epoch}/20] Loss: ${loss.toFixed(4)} | Accuracy: ${(acc * 100).toFixed(1)}%`]);
      setMetrics(ai.getMetrics());
    });
    
    setTrainingLog(prev => [...prev, '[INFO] Training complete!', `[INFO] Final Accuracy: ${(newMetrics.accuracy * 100).toFixed(1)}%`]);
    setMetrics(newMetrics);
    setIsTraining(false);
  }, [ai]);

  const handleTestSeverity = () => {
    if (!testText.trim()) return;
    const result = ai.predictSeverity('test', testText);
    setTestResult(result);
  };

  const handleTestDuplicate = () => {
    if (!dupText.trim()) return;
    ai.indexBugs(bugs);
    const results = ai.detectDuplicates(dupText, dupText, bugs, 0.1);
    setDupResults(results);
  };

  const trainingData = metrics.trainingLoss.map((loss, i) => ({
    epoch: i + 1,
    loss: parseFloat(loss.toFixed(4)),
    accuracy: parseFloat((metrics.trainingAccuracy[i] * 100).toFixed(1)),
  }));

  const confLabels = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-3xl">🧠</span>
        <div>
          <h1 className="text-2xl font-bold text-white">AI / Deep Learning Engine</h1>
          <p className="text-sm text-slate-400">NLP-powered bug analysis with TF-IDF, Word Embeddings & Neural Networks</p>
        </div>
      </div>

      {/* Architecture Overview */}
      <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-xl border border-purple-500/20 p-5">
        <h3 className="text-sm font-semibold text-white mb-4">🏗️ Model Architecture</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {[
            { title: 'Text Preprocessing', desc: 'Tokenization → Stop Word Removal → Porter Stemming', icon: '📝', color: 'border-blue-500/30 bg-blue-500/5' },
            { title: 'TF-IDF Vectorizer', desc: 'Term Frequency × Inverse Document Frequency vectorization', icon: '📊', color: 'border-purple-500/30 bg-purple-500/5' },
            { title: 'Word Embeddings', desc: '32-dim word vectors with domain-specific clustering', icon: '🔤', color: 'border-indigo-500/30 bg-indigo-500/5' },
            { title: 'Neural Classifier', desc: '2-layer network: Input(4) → ReLU(16) → Softmax(4)', icon: '🧬', color: 'border-green-500/30 bg-green-500/5' },
          ].map(item => (
            <div key={item.title} className={`p-4 rounded-lg border ${item.color}`}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <h4 className="text-xs font-semibold text-white mb-1">{item.title}</h4>
              <p className="text-[11px] text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-slate-500">
          <span className="text-xs">Input Text</span>
          <span>→</span>
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] rounded">Preprocess</span>
          <span>→</span>
          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-[10px] rounded">TF-IDF + Embed</span>
          <span>→</span>
          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-[10px] rounded">Feature Extract</span>
          <span>→</span>
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] rounded">Classify</span>
          <span>→</span>
          <span className="text-xs">Prediction</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Accuracy', value: `${(metrics.accuracy * 100).toFixed(1)}%`, color: 'text-green-400' },
          { label: 'Precision', value: `${(metrics.precision * 100).toFixed(1)}%`, color: 'text-blue-400' },
          { label: 'Recall', value: `${(metrics.recall * 100).toFixed(1)}%`, color: 'text-purple-400' },
          { label: 'F1 Score', value: `${(metrics.f1Score * 100).toFixed(1)}%`, color: 'text-indigo-400' },
        ].map(m => (
          <div key={m.label} className="bg-white/5 rounded-xl border border-white/5 p-4 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-slate-500 mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Training Curves */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">📉 Training Curves</h3>
            <button onClick={handleRetrain} disabled={isTraining}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${isTraining ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-500 text-white'}`}>
              {isTraining ? `Training... (${metrics.epoch}/${metrics.totalEpochs})` : '🔄 Retrain Model'}
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="epoch" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} label={{ value: 'Epoch', position: 'bottom', fill: '#64748b', fontSize: 10 }} />
              <YAxis yAxisId="loss" orientation="left" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} />
              <YAxis yAxisId="acc" orientation="right" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="loss" type="monotone" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} name="Loss" />
              <Line yAxisId="acc" type="monotone" dataKey="accuracy" stroke="#22c55e" strokeWidth={2} dot={false} name="Accuracy %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🔢 Confusion Matrix</h3>
          <div className="flex justify-center">
            <div>
              <div className="flex items-center mb-1 ml-16">
                {confLabels.map(l => (
                  <div key={l} className="w-14 text-center text-[10px] text-slate-500">{l}</div>
                ))}
              </div>
              {metrics.confusionMatrix.map((row, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-16 text-right pr-2 text-[10px] text-slate-500">{confLabels[i]}</div>
                  {row.map((val, j) => {
                    const max = Math.max(...row);
                    const intensity = max > 0 ? val / max : 0;
                    const isDiag = i === j;
                    return (
                      <div key={j} className={`w-14 h-10 flex items-center justify-center text-xs font-mono border border-white/5 ${
                        isDiag ? 'font-bold' : ''
                      }`} style={{
                        backgroundColor: isDiag
                          ? `rgba(34, 197, 94, ${intensity * 0.4})`
                          : `rgba(239, 68, 68, ${intensity * 0.3})`,
                        color: isDiag ? '#4ade80' : intensity > 0.3 ? '#fca5a5' : '#64748b'
                      }}>
                        {val}
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="flex items-center mt-2 ml-16">
                <p className="text-[10px] text-slate-600 italic">Predicted →</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Severity Prediction */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🧪 Test Severity Classifier</h3>
          <div className="space-y-3">
            <textarea value={testText} onChange={e => setTestText(e.target.value)} rows={3}
              placeholder="Enter bug description to classify severity..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            <button onClick={handleTestSeverity} className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition">
              🧠 Predict Severity
            </button>
            {testResult && (
              <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Prediction:</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded capitalize ${
                    testResult.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    testResult.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    testResult.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>{testResult.severity}</span>
                </div>
                <div className="space-y-1">
                  {Object.entries(testResult.scores).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 w-12 capitalize">{key}</span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${key === testResult.severity ? 'bg-purple-500' : 'bg-slate-700'}`}
                          style={{ width: `${val * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-500 w-10 text-right">{(val * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                {testResult.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {testResult.features.map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] rounded">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Test Duplicate Detection */}
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-4">🔍 Test Duplicate Detection</h3>
          <div className="space-y-3">
            <textarea value={dupText} onChange={e => setDupText(e.target.value)} rows={3}
              placeholder="Enter bug title to check for duplicates..."
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
            <button onClick={handleTestDuplicate} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition">
              🔍 Find Duplicates
            </button>
            {dupResults.length > 0 ? (
              <div className="space-y-2">
                {dupResults.map(d => (
                  <div key={d.bugId} className={`p-2.5 rounded-lg border ${d.score > 0.6 ? 'bg-red-500/10 border-red-500/20' : d.score > 0.3 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-800/50 border-white/5'}`}>
                    <div className="flex justify-between items-start">
                      <p className="text-xs text-white line-clamp-1 flex-1">{d.bugTitle}</p>
                      <span className={`text-xs font-mono font-bold ml-2 ${d.score > 0.6 ? 'text-red-400' : d.score > 0.3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                        {(d.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{d.method}</p>
                  </div>
                ))}
              </div>
            ) : dupText && (
              <div className="p-2.5 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs text-green-400">✅ No similar bugs found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Training Log */}
      {trainingLog.length > 0 && (
        <div className="bg-white/5 rounded-xl border border-white/5 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">📋 Training Log</h3>
          <div className="bg-black/40 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-xs">
            {trainingLog.map((log, i) => (
              <div key={i} className={`${log.includes('[INFO]') ? 'text-blue-400' : log.includes('Loss') ? 'text-slate-400' : 'text-green-400'}`}>
                {log}
              </div>
            ))}
            {isTraining && <span className="text-purple-400 animate-pulse">▊</span>}
          </div>
        </div>
      )}

      {/* Model Info */}
      <div className="bg-white/5 rounded-xl border border-white/5 p-5">
        <h3 className="text-sm font-semibold text-white mb-3">ℹ️ Model Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { label: 'Last Trained', value: new Date(metrics.lastTrained).toLocaleString() },
            { label: 'Total Predictions', value: metrics.totalPredictions.toString() },
            { label: 'Vocabulary Size', value: ai.getVocabularySize().toString() + ' terms' },
            { label: 'Embedding Dim', value: '32-dimensional' },
            { label: 'Hidden Layers', value: '1 (16 neurons)' },
            { label: 'Activation', value: 'ReLU + Softmax' },
            { label: 'Similarity Method', value: 'TF-IDF + Embeddings' },
            { label: 'Ensemble Weight', value: '60% TF-IDF, 40% Embed' },
          ].map(info => (
            <div key={info.label} className="p-3 bg-slate-800/30 rounded-lg">
              <p className="text-slate-500 mb-0.5">{info.label}</p>
              <p className="text-slate-300 font-medium">{info.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import { Mic, MicOff, Check, X, Sparkles, Volume2, AlertCircle } from 'lucide-react';

interface VoiceExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  currency?: string;
}

export const VoiceExpenseModal: React.FC<VoiceExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency = 'PKR',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualText, setManualText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [parsedDraft, setParsedDraft] = useState<Partial<Transaction> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTranscript('');
      setManualText('');
      setParsedDraft(null);
      setError(null);
      setIsListening(false);
      return;
    }

    // Check browser speech recognition support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    setError(null);
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let current = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          current += event.results[i][0].transcript;
        }
        setTranscript(current);
        setManualText(current);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied. You can type your sentence below instead.');
        } else {
          setError(`Voice input error (${event.error}). Feel free to type your expense.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setError('Could not access microphone: ' + err.message);
    }
  };

  const handleParse = async (textToParse: string) => {
    if (!textToParse.trim()) {
      setError('Please speak or type an expense statement first.');
      return;
    }

    setError(null);
    setParsing(true);
    try {
      const res = await api.parseVoiceExpense(textToParse);
      setParsedDraft(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to parse expense with AI');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!parsedDraft || !parsedDraft.amount) return;
    setSaving(true);
    setError(null);

    try {
      const res = await api.createTransaction({
        type: parsedDraft.type || 'expense',
        amount: parsedDraft.amount,
        category: parsedDraft.category || 'Other',
        description: parsedDraft.description || manualText || transcript,
        date: new Date().toISOString().split('T')[0],
        payment_method: parsedDraft.payment_method || 'Cash',
      });

      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record parsed transaction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Voice Expense Entry</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Voice Prompt Box */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-center">
            <p className="text-xs text-slate-600 mb-3">
              Press the mic and say something like:
              <br />
              <span className="font-bold text-indigo-900">
                “I spent 350 rupees on cafeteria lunch”
              </span>{' '}
              or{' '}
              <span className="font-bold text-indigo-900">
                “Received 15000 pocket money via EasyPaisa”
              </span>
            </p>

            <button
              type="button"
              onClick={toggleListening}
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30 ring-4 ring-rose-200'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            <span className="text-[11px] font-semibold text-slate-500 mt-2 block">
              {isListening ? 'Listening... Speak now' : 'Tap to start speaking'}
            </span>
          </div>

          {/* Transcript / Manual Input fallback */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Spoken Text or Manual Sentence:
            </label>
            <textarea
              rows={2}
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="e.g. Paid 450 rupees for biryani and drinks with cash"
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
            />
            <button
              type="button"
              disabled={parsing || !manualText.trim()}
              onClick={() => handleParse(manualText)}
              className="mt-2 w-full text-xs font-semibold py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {parsing ? 'Parsing with Gemini AI...' : 'Parse Sentence into Transaction'}
            </button>
          </div>

          {/* Parsed Draft Confirmation View */}
          {parsedDraft && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span>Parsed Draft Transaction:</span>
                <span className="uppercase text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded text-emerald-800">
                  {parsedDraft.type}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Amount:</span>
                  <span className="font-bold text-slate-900">
                    {currency} {parsedDraft.amount?.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Category:</span>
                  <span className="font-semibold">{parsedDraft.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Method:</span>
                  <span>{parsedDraft.payment_method}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date:</span>
                  <span>Today</span>
                </div>
              </div>

              <div className="text-xs pt-1 border-t border-emerald-200/60">
                <span className="text-slate-400 text-[10px] block">Description:</span>
                <span className="text-slate-800 font-medium">{parsedDraft.description}</span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setParsedDraft(null)}
                  className="w-1/3 text-xs font-semibold py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  Adjust
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleConfirmSave}
                  className="w-2/3 text-xs font-semibold py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Confirm & Record'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

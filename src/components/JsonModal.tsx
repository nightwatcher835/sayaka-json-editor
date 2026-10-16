import React, { useState, useEffect } from 'react';
import { CardDocument } from '../types/card';
import { X, Check, Copy, AlertTriangle, Code, RefreshCw } from 'lucide-react';

interface JsonModalProps {
  isOpen: boolean;
  card: CardDocument | null;
  onClose: () => void;
  onApply: (updated: CardDocument) => void;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  card,
  onClose,
  onApply,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (card && isOpen) {
      try {
        setJsonText(JSON.stringify(card, null, 2));
        setError(null);
      } catch (err: any) {
        setError(err.message);
      }
    }
  }, [card, isOpen]);

  if (!isOpen || !card) return null;

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err: any) {
      setError(`Erro de sintaxe JSON: ${err.message}`);
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('O JSON deve representar um objeto de carta válido.');
      }
      onApply(parsed as CardDocument);
      onClose();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header do Modal */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                JSON Completo do Documento
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {card.name} • {card._id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFormat}
              title="Formatar / Indentar"
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Formatar</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded border border-zinc-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Banner de Erro de Sintaxe se houver */}
        {error && (
          <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-900/60 text-rose-300 text-xs flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span className="font-mono">{error}</span>
          </div>
        )}

        {/* Textarea Editor */}
        <div className="flex-1 p-3 bg-zinc-950 overflow-hidden flex flex-col">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (error) setError(null);
            }}
            spellCheck={false}
            className="w-full flex-1 bg-zinc-950 text-zinc-200 font-mono text-xs p-3 rounded-lg border border-zinc-800/80 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          />
        </div>

        {/* Footer com ações */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between flex-shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            {jsonText.split('\n').length} linhas • {jsonText.length.toLocaleString()} caracteres
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Aplicar JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

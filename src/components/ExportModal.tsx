import React, { useState } from 'react';
import { CardDocument, ExportFormat, FileMetadata } from '../types/card';
import { downloadCardsJson } from '../utils/fileProcessor';
import { formatBytes } from '../utils/cardUtils';
import {
  Download,
  X,
  FileJson,
  FileCode,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  cards: CardDocument[];
  dirtyIds: Set<string>;
  fileMeta: FileMetadata | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  cards,
  dirtyIds,
  fileMeta,
  onClose,
}) => {
  const [format, setFormat] = useState<ExportFormat>('json-pretty');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const originalName = fileMeta?.fileName || 'colecao_cards.json';
  const modifiedCount = dirtyIds.size;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      setProgress(0);
      setErrorMessage(null);
      setExportComplete(false);

      await downloadCardsJson(
        cards,
        format,
        originalName,
        dirtyIds,
        (p) => setProgress(p)
      );

      setExportComplete(true);
      setTimeout(() => {
        setIsExporting(false);
      }, 800);
    } catch (err: any) {
      setIsExporting(false);
      setErrorMessage(err.message || 'Erro ao gerar arquivo para download.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Exportar e Baixar Novo JSON
              </h3>
              <p className="text-xs text-zinc-400">
                Gera o arquivo processado de forma eficiente para download
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo de Opções de Exportação */}
        <div className="p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-zinc-300">
              Formato de Saída:
            </label>

            {/* Opção 1: JSON Formatado */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                format === 'json-pretty'
                  ? 'bg-blue-600/10 border-blue-500/50 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <input
                type="radio"
                name="export-format"
                checked={format === 'json-pretty'}
                onChange={() => setFormat('json-pretty')}
                className="mt-0.5 text-blue-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <FileJson className="w-3.5 h-3.5 text-blue-400" />
                  <span>JSON Completo Formatado (Recomendado)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Indentado com 2 espaços, ideal para leitura, inspeção e controle de versão.
                </p>
              </div>
            </label>

            {/* Opção 2: JSON Minificado */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                format === 'json-minified'
                  ? 'bg-blue-600/10 border-blue-500/50 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <input
                type="radio"
                name="export-format"
                checked={format === 'json-minified'}
                onChange={() => setFormat('json-minified')}
                className="mt-0.5 text-blue-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JSON Completo Compacto (Minificado)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Menor tamanho de arquivo e download mais rápido, ideal para APIs e datasets gigantes.
                </p>
              </div>
            </label>

            {/* Opção 3: Apenas Modificados */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                format === 'modified-only'
                  ? 'bg-blue-600/10 border-blue-500/50 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <input
                type="radio"
                name="export-format"
                checked={format === 'modified-only'}
                onChange={() => setFormat('modified-only')}
                className="mt-0.5 text-blue-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apenas Cartas Modificadas nesta Sessão ({modifiedCount})</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Exporta somente os documentos editados ou criados desde a abertura.
                </p>
              </div>
            </label>

            {/* Opção 4: NDJSON Mongo */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                format === 'ndjson-mongo'
                  ? 'bg-blue-600/10 border-blue-500/50 text-zinc-100 shadow-sm'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
              }`}
            >
              <input
                type="radio"
                name="export-format"
                checked={format === 'ndjson-mongo'}
                onChange={() => setFormat('ndjson-mongo')}
                className="mt-0.5 text-blue-600 focus:ring-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <Database className="w-3.5 h-3.5 text-purple-400" />
                  <span>MongoDB Lines (NDJSON para mongoimport)</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  1 documento JSON por linha. Compatível direto com mongoimport e streaming.
                </p>
              </div>
            </label>
          </div>

          {/* Resumo dos dados */}
          <div className="p-3 rounded-lg bg-zinc-950/80 border border-zinc-800/60 text-xs space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Total de cartas na memória:</span>
              <span className="font-mono text-zinc-200">{cards.length.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Cartas alteradas:</span>
              <span className="font-mono text-amber-400">{modifiedCount.toLocaleString()}</span>
            </div>
            {fileMeta && (
              <div className="flex justify-between text-zinc-400">
                <span>Tamanho do arquivo original:</span>
                <span className="font-mono text-zinc-300">
                  {formatBytes(fileMeta.fileSizeBytes)}
                </span>
              </div>
            )}
          </div>

          {/* Barra de progresso para lotes pesados */}
          {isExporting && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                  Processando blocos de dados...
                </span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {exportComplete && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Download concluído com sucesso! O novo arquivo foi salvo no seu computador.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting || (format === 'modified-only' && modifiedCount === 0)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting ? 'Processando...' : 'Iniciar Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

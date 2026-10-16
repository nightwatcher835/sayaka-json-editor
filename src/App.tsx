import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { CardDocument, FileMetadata } from './types/card';
import { buildCardIndex, filterIndexedCards, IndexedCard } from './utils/searchIndex';
import { parseJsonFile } from './utils/fileProcessor';
import { cloneCard, generateObjectId, formatBytes } from './utils/cardUtils';
import { VirtualCardList } from './components/VirtualCardList';
import { CardEditor } from './components/CardEditor';
import { JsonModal } from './components/JsonModal';
import { ExportModal } from './components/ExportModal';
import { BatchToolsModal } from './components/BatchToolsModal';
import {
  Upload,
  Download,
  Search,
  Plus,
  Wrench,
  FileJson,
  Check,
  FolderOpen
} from 'lucide-react';

export default function App() {
  // Estado principal da coleção (inicia vazio, sem mocks)
  const [cards, setCards] = useState<CardDocument[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Controle de modificações
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());

  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [missingTcgOnly, setMissingTcgOnly] = useState(false);
  const [searchTimeMs, setSearchTimeMs] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Metadados do arquivo carregado
  const [fileMeta, setFileMeta] = useState<FileMetadata>({
    fileName: 'Nenhum arquivo carregado',
    fileSizeBytes: 0,
    totalCards: 0,
    totalVariants: 0,
    missingTcgCount: 0,
    modifiedCount: 0,
    loadedAt: new Date(),
  });

  // Status e Notificações (estilo statusBar do PyQt)
  const [statusMessage, setStatusMessage] = useState('Aguardando arquivo JSON...');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modais
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ percent: 0, status: '' });

  // Input de arquivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exibe toast temporário
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  // Constrói índice de busca memoizado
  const cardIndex: IndexedCard[] = useMemo(() => {
    return buildCardIndex(cards);
  }, [cards]);

  // Lista filtrada com medição de performance em milissegundos
  const filteredCards = useMemo(() => {
    const t0 = performance.now();
    const result = filterIndexedCards(cardIndex, searchTerm, missingTcgOnly);
    const t1 = performance.now();
    setSearchTimeMs(Math.round((t1 - t0) * 10) / 10);
    return result;
  }, [cardIndex, searchTerm, missingTcgOnly]);

  // Documento selecionado ativo
  const currentCard = useMemo(() => {
    if (!selectedCardId) return null;
    return cards.find((c) => c._id === selectedCardId) || null;
  }, [cards, selectedCardId]);

  // Se o item selecionado não existir nos filtrados, ajusta seleção
  useEffect(() => {
    if (filteredCards.length > 0) {
      const exists = filteredCards.some((c) => c._id === selectedCardId);
      if (!exists && !selectedCardId) {
        setSelectedCardId(filteredCards[0]._id);
      }
    } else if (cards.length === 0) {
      setSelectedCardId(null);
    }
  }, [filteredCards, selectedCardId, cards.length]);

  // Processa arquivo selecionado ou dropado
  const processFile = async (file: File) => {
    try {
      setIsLoadingFile(true);
      setStatusMessage(`Carregando ${file.name}...`);
      const { cards: loadedCards, meta } = await parseJsonFile(file, (p, s) => {
        setLoadingProgress({ percent: p, status: s });
      });

      setCards(loadedCards);
      setDirtyIds(new Set());
      setFileMeta(meta);
      setSelectedCardId(loadedCards[0]?._id || null);
      setSearchTerm('');
      setMissingTcgOnly(false);
      setStatusMessage(`Pronto (${loadedCards.length.toLocaleString()} cartas carregadas)`);
      showToast(`Arquivo "${file.name}" carregado com sucesso!`);
    } catch (err: any) {
      alert(`Falha ao ler o arquivo JSON: ${err.message}`);
      setStatusMessage('Erro ao carregar arquivo');
    } finally {
      setIsLoadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manipulação de Upload via Input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Suporte a Drag & Drop de arquivos
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Salvar edições do cartão atual
  const handleSaveCard = (updatedCard: CardDocument) => {
    setCards((prev) =>
      prev.map((c) => (c._id === updatedCard._id ? updatedCard : c))
    );
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(updatedCard._id);
      return next;
    });
    setStatusMessage(`Salvo: ${updatedCard.name || updatedCard.id}`);
    showToast(`"${updatedCard.name || 'Carta'}" atualizada com sucesso!`);
  };

  // Criar nova carta (equivalente a nova_carta() no PyQt)
  const handleCreateNewCard = () => {
    const newCard: CardDocument = {
      _id: generateObjectId(),
      id: `CARD-${cards.length + 1}`,
      code: 'NEW-001',
      name: 'Nova Carta',
      images: {
        small: '',
        large: '',
      },
      variants: [],
    };

    setCards((prev) => [newCard, ...prev]);
    setSelectedCardId(newCard._id);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(newCard._id);
      return next;
    });

    if (cards.length === 0) {
      setFileMeta((prev) => ({
        ...prev,
        fileName: 'nova_colecao.json',
      }));
    }

    setStatusMessage('Nova carta criada');
    showToast('Novo documento de carta criado!');
  };

  // Duplicar carta
  const handleDuplicateCard = (cardToDuplicate: CardDocument) => {
    const duplicated: CardDocument = cloneCard(cardToDuplicate);
    duplicated._id = generateObjectId();
    duplicated.id = `${duplicated.id || 'CARD'}-COPY`;
    duplicated.name = `${duplicated.name || 'Carta'} (Cópia)`;

    setCards((prev) => [duplicated, ...prev]);
    setSelectedCardId(duplicated._id);
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(duplicated._id);
      return next;
    });
    setStatusMessage(`Carta duplicada: ${duplicated.name}`);
    showToast('Carta duplicada como novo documento!');
  };

  // Excluir carta
  const handleDeleteCard = (cardId: string) => {
    const cardToDelete = cards.find((c) => c._id === cardId);
    if (!confirm(`Excluir definitivamente "${cardToDelete?.name || 'esta carta'}"?`)) {
      return;
    }

    setCards((prev) => prev.filter((c) => c._id !== cardId));
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });

    if (selectedCardId === cardId) {
      const remaining = cards.filter((c) => c._id !== cardId);
      setSelectedCardId(remaining[0]?._id || null);
    }

    setStatusMessage('Carta excluída');
    showToast('Documento removido da coleção.');
  };

  // Aplicar edições em massa
  const handleApplyBatchChanges = (updatedCards: CardDocument[], message: string) => {
    setCards(updatedCards);
    const nextDirty = new Set(dirtyIds);
    updatedCards.forEach((c) => nextDirty.add(c._id));
    setDirtyIds(nextDirty);
    showToast(message);
    setStatusMessage(message);
  };

  // Atalhos de teclado (Ctrl+S para salvar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentCard) {
          handleSaveCard(currentCard);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCard]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans select-none overflow-hidden relative ${
        isDraggingOver ? 'ring-4 ring-blue-500/50 ring-inset' : ''
      }`}
    >
      {/* Input de arquivo invisível */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.ndjson,.jsonl,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Overlay quando arrastando arquivo para a tela */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-blue-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center border-4 border-dashed border-blue-400">
          <Upload className="w-16 h-16 text-blue-300 animate-bounce mb-3" />
          <h2 className="text-xl font-bold text-white">Solte o arquivo JSON aqui</h2>
          <p className="text-sm text-blue-200 mt-1">
            O arquivo será processado e indexado imediatamente.
          </p>
        </div>
      )}

      {/* Barra de Topo Principal */}
      <header className="h-14 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-4 flex-shrink-0 shadow-md">
        {/* Identidade do App e status do arquivo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-black text-sm">
            CJ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">
                Cardumy JSON Studio
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
                v2.0 Turbo
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-mono">
              <span className="truncate max-w-[200px]" title={fileMeta.fileName}>
                {fileMeta.fileName}
              </span>
              <span>•</span>
              <span>{cards.length.toLocaleString()} cartas</span>
              {fileMeta.fileSizeBytes > 0 && (
                <>
                  <span>•</span>
                  <span>{formatBytes(fileMeta.fileSizeBytes)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ações da Direita: Upload, Batch Tools, Download */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoadingFile}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar JSON</span>
          </button>

          {cards.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                title="Ferramentas em massa e estatísticas do dataset"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/80 transition-colors shadow-sm cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Ferramentas em Massa</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer relative"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
                {dirtyIds.size > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-amber-400 text-zinc-950 text-[10px] font-black rounded-full">
                    {dirtyIds.size}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Overlay de carregamento ao ler arquivos gigantes */}
      {isLoadingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mb-4 animate-bounce shadow-xl">
            <FileJson className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-zinc-100 mb-1">
            Processando Arquivo com Alta Eficiência
          </h3>
          <p className="text-xs text-zinc-400 mb-4 font-mono">{loadingProgress.status}</p>
          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-150"
              style={{ width: `${loadingProgress.percent}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 font-mono mt-2">
            {loadingProgress.percent}%
          </span>
        </div>
      )}

      {/* Toast flutuante de sucesso / status */}
      {toastMessage && (
        <div className="fixed bottom-10 right-6 z-50 bg-zinc-900 border border-zinc-700 text-zinc-100 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs animate-fade-in font-medium">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Se não há cartas carregadas: tela inicial de boas-vindas / dropzone */}
      {cards.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-center">
          <div className="max-w-md w-full p-8 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-blue-500/50 bg-zinc-900/40 transition-colors flex flex-col items-center shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-400 shadow-inner">
              <FolderOpen className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold text-zinc-100 mb-2">
              Nenhum arquivo carregado
            </h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Arraste e solte o seu arquivo JSON aqui, ou clique no botão abaixo para carregar sua coleção de cartas e variantes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Carregar Arquivo JSON</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNewCard}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Carta</span>
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800/60 text-[11px] text-zinc-500 font-mono flex items-center justify-center gap-3">
              <span>Formatos suportados:</span>
              <span className="text-zinc-400 font-semibold">.json</span>
              <span className="text-zinc-400 font-semibold">.ndjson</span>
              <span className="text-zinc-400 font-semibold">.jsonl</span>
            </div>
          </div>
        </div>
      ) : (
        /* Corpo Dividido em Splitter (Esquerda: Filtros e Lista Virtual | Direita: Editor de Cartas) */
        <div className="flex-1 flex overflow-hidden">
          {/* Painel Esquerdo: Busca, Filtro e Lista de Documentos */}
          <aside className="w-80 md:w-96 border-r border-zinc-800 bg-zinc-950 flex flex-col flex-shrink-0">
            {/* Caixa de Busca e Botão Nova Carta */}
            <div className="p-3 border-b border-zinc-800/80 space-y-2 bg-zinc-900/40">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ID, nome, code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-7 py-1.5 text-zinc-200 text-xs placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 font-medium"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleCreateNewCard}
                  title="Criar novo documento de carta"
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-md text-xs font-semibold shadow-sm transition-colors cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova</span>
                </button>
              </div>

              {/* Checkbox de TCGPlayer ID Vazio */}
              <div className="flex items-center justify-between pt-0.5">
                <label
                  className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer select-none"
                  title="Mostrar apenas documentos com alguma variant cujo tcgplayerId seja null ou vazio."
                >
                  <input
                    type="checkbox"
                    checked={missingTcgOnly}
                    onChange={(e) => setMissingTcgOnly(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                  />
                  <span className={missingTcgOnly ? 'text-amber-400 font-semibold' : ''}>
                    TCGPlayer ID vazio
                  </span>
                </label>

                {/* Indicador de Latência de Busca */}
                <span className="text-[10px] text-zinc-500 font-mono">
                  {searchTimeMs}ms
                </span>
              </div>
            </div>

            {/* Lista Virtualizada (Renderiza 10.000+ cartas com zero lag) */}
            <VirtualCardList
              cards={filteredCards}
              selectedId={selectedCardId}
              dirtyIds={dirtyIds}
              onSelectCard={(card) => {
                setSelectedCardId(card._id);
                setStatusMessage(`Carta carregada: ${card.name || card.id}`);
              }}
            />

            {/* Status da Lista no Rodapé do Painel Esquerdo */}
            <div className="px-3 py-2 border-t border-zinc-800/80 bg-zinc-900/60 text-[11px] text-zinc-400 flex items-center justify-between font-mono flex-shrink-0">
              <span>
                {filteredCards.length.toLocaleString()} documento(s) exibido(s)
              </span>
              <span className="text-zinc-400">
                total {cards.length.toLocaleString()}
              </span>
            </div>
          </aside>

          {/* Painel Direito: Editor do Documento e Variantes */}
          <main className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
            <CardEditor
              card={currentCard}
              isDirty={currentCard ? dirtyIds.has(currentCard._id) : false}
              onSave={handleSaveCard}
              onDelete={handleDeleteCard}
              onDuplicate={handleDuplicateCard}
              onOpenRawJson={() => setIsJsonModalOpen(true)}
            />
          </main>
        </div>
      )}

      {/* Barra de Status Inferior */}
      <footer className="h-6 px-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-mono flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <strong className="text-zinc-300 font-medium">{statusMessage}</strong>
          </span>
          {dirtyIds.size > 0 && (
            <span className="text-amber-400">
              • {dirtyIds.size} carta(s) modificada(s) nesta sessão
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-zinc-400">
          <span>Engine: Virtualized In-Memory Index</span>
          <span>Chunked Blob Exporter</span>
        </div>
      </footer>

      {/* Modais */}
      <JsonModal
        isOpen={isJsonModalOpen}
        card={currentCard}
        onClose={() => setIsJsonModalOpen(false)}
        onApply={(updated) => {
          handleSaveCard(updated);
          setIsJsonModalOpen(false);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        cards={cards}
        dirtyIds={dirtyIds}
        fileMeta={fileMeta}
        onClose={() => setIsExportModalOpen(false)}
      />

      <BatchToolsModal
        isOpen={isBatchModalOpen}
        cards={cards}
        onApplyBatchChanges={handleApplyBatchChanges}
        onClose={() => setIsBatchModalOpen(false)}
      />
    </div>
  );
}

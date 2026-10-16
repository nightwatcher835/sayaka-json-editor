import React, { useState } from 'react';
import { CardDocument } from '../types/card';
import { isTcgPlayerIdEmpty } from '../utils/cardUtils';
import { findDuplicateTcgPlayerIds } from '../utils/searchIndex';
import {
  Wrench,
  X,
  Sparkles,
  Percent,
  Layers,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Copy
} from 'lucide-react';

interface BatchToolsModalProps {
  isOpen: boolean;
  cards: CardDocument[];
  onApplyBatchChanges: (updatedCards: CardDocument[], message: string) => void;
  onClose: () => void;
}

export const BatchToolsModal: React.FC<BatchToolsModalProps> = ({
  isOpen,
  cards,
  onApplyBatchChanges,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'fill-tcg' | 'set-code' | 'pricing' | 'stats'>('stats');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // States para Ferramentas em Massa
  const [tcgPrefix, setTcgPrefix] = useState('TCG-');
  const [tcgUseCode, setTcgUseCode] = useState(true);

  const [fromSetCode, setFromSetCode] = useState('');
  const [toSetCode, setToSetCode] = useState('');
  const [toSetName, setToSetName] = useState('');

  const [priceAdjustPercent, setPriceAdjustPercent] = useState('10');
  const [priceTarget, setPriceTarget] = useState<'both' | 'price' | 'marketPrice'>('both');

  if (!isOpen) return null;

  // Estatísticas calculadas
  const totalCards = cards.length;
  let totalVariants = 0;
  let missingTcgVariants = 0;
  let missingTcgCards = 0;
  let totalMarketPrice = 0;
  let pricedVariantsCount = 0;

  const setCodeDistribution: Record<string, number> = {};

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const variants = card.variants || [];
    totalVariants += variants.length;
    let cardHasMissing = variants.length === 0;

    for (let v = 0; v < variants.length; v++) {
      const variant = variants[v];
      if (isTcgPlayerIdEmpty(variant)) {
        missingTcgVariants++;
        cardHasMissing = true;
      }
      if (variant.marketPrice && !isNaN(variant.marketPrice)) {
        totalMarketPrice += variant.marketPrice;
        pricedVariantsCount++;
      }
      const sCode = variant.set?.set_code || 'SEM_SET';
      setCodeDistribution[sCode] = (setCodeDistribution[sCode] || 0) + 1;
    }

    if (cardHasMissing) {
      missingTcgCards++;
    }
  }

  // Ação 1: Preencher TCGPlayer ID vazio
  const handleFillEmptyTcg = () => {
    let modified = 0;
    const updated = cards.map((card, cIdx) => {
      let cardChanged = false;
      const variants = (card.variants || []).map((v, vIdx) => {
        if (isTcgPlayerIdEmpty(v)) {
          cardChanged = true;
          modified++;
          const generatedId = tcgUseCode
            ? `${tcgPrefix}${card.code || card.id || cIdx + 1}-V${vIdx + 1}`
            : `${tcgPrefix}${100000 + cIdx * 10 + vIdx + 1}`;
          return { ...v, tcgplayerId: generatedId };
        }
        return v;
      });
      return cardChanged ? { ...card, variants } : card;
    });

    onApplyBatchChanges(updated, `${modified} variantes com TCGPlayer ID vazio foram preenchidas!`);
    setSuccessMessage(`${modified} variantes atualizadas.`);
  };

  // Ação 2: Substituir Set Code
  const handleReplaceSetCode = () => {
    if (!fromSetCode.trim() || !toSetCode.trim()) return;

    let modified = 0;
    const cleanFrom = fromSetCode.trim().toLowerCase();
    const cleanTo = toSetCode.trim();

    const updated = cards.map((card) => {
      let cardChanged = false;
      const variants = (card.variants || []).map((v) => {
        if (v.set && String(v.set.set_code || '').trim().toLowerCase() === cleanFrom) {
          cardChanged = true;
          modified++;
          return {
            ...v,
            set: {
              ...v.set,
              set_code: cleanTo,
              ...(toSetName.trim() ? { name: toSetName.trim() } : {}),
            },
          };
        }
        return v;
      });
      return cardChanged ? { ...card, variants } : card;
    });

    onApplyBatchChanges(updated, `Set code atualizado em ${modified} variantes.`);
    setSuccessMessage(`${modified} variantes tiveram o Set Code alterado.`);
  };

  // Ação 3: Reajustar Preços
  const handleAdjustPrices = () => {
    const percent = parseFloat(priceAdjustPercent);
    if (isNaN(percent) || percent === 0) return;

    const multiplier = 1 + percent / 100;
    let modified = 0;

    const updated = cards.map((card) => {
      let cardChanged = false;
      const variants = (card.variants || []).map((v) => {
        const next = { ...v };
        if (
          (priceTarget === 'both' || priceTarget === 'price') &&
          v.price !== null &&
          v.price !== undefined
        ) {
          next.price = Math.round(v.price * multiplier * 100) / 100;
          cardChanged = true;
        }
        if (
          (priceTarget === 'both' || priceTarget === 'marketPrice') &&
          v.marketPrice !== null &&
          v.marketPrice !== undefined
        ) {
          next.marketPrice = Math.round(v.marketPrice * multiplier * 100) / 100;
          cardChanged = true;
        }
        if (cardChanged) modified++;
        return next;
      });
      return cardChanged ? { ...card, variants } : card;
    });

    onApplyBatchChanges(updated, `Preços reajustados em ${modified} variantes.`);
    setSuccessMessage(`Preços recalculados com sucesso em ${modified} variantes.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-sm font-bold text-zinc-100">
                Ferramentas em Massa e Diagnóstico
              </h3>
              <p className="text-xs text-zinc-400">
                Operações otimizadas para processar todo o volume de dados em milissegundos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 text-xs px-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('stats');
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Estatísticas & Saúde
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('fill-tcg');
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'fill-tcg'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Preencher TCGPlayer IDs
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('set-code');
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'set-code'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> Substituir Set Code
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pricing');
              setSuccessMessage(null);
            }}
            className={`py-2.5 px-3 font-medium border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'pricing'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" /> Reajuste de Preços
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="p-5 flex-1 min-h-[280px]">
          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Aba 1: Estatísticas */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Estatísticas com TCG Vazio e TCG Repetido */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Total Cartas</span>
                  <div className="text-xl font-bold text-zinc-100 font-mono mt-0.5">
                    {totalCards.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Total Variantes</span>
                  <div className="text-xl font-bold text-blue-400 font-mono mt-0.5">
                    {totalVariants.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">TCG Vazio (Docs)</span>
                  <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                    {missingTcgCards.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">TCG Repetidos</span>
                  <div className={`text-xl font-bold font-mono mt-0.5 ${findDuplicateTcgPlayerIds(cards).size > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {findDuplicateTcgPlayerIds(cards).size.toLocaleString()}
                  </div>
                </div>
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">Média Var/Carta</span>
                  <div className="text-xl font-bold text-zinc-200 font-mono mt-0.5">
                    {totalCards > 0 ? (totalVariants / totalCards).toFixed(1) : '0'}
                  </div>
                </div>
              </div>

              {/* Lista de TCGPlayer IDs repetidos se houver */}
              {findDuplicateTcgPlayerIds(cards).size > 0 && (
                <div className="bg-rose-950/20 p-3 rounded-lg border border-rose-900/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-300 font-semibold text-xs">
                    <Copy className="w-3.5 h-3.5" />
                    <span>TCGPlayer IDs que aparecem mais de uma vez:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {Array.from(findDuplicateTcgPlayerIds(cards)).map((dupId) => (
                      <span
                        key={dupId}
                        className="px-2 py-0.5 bg-rose-950/60 border border-rose-800/60 rounded text-[11px] font-mono text-rose-200"
                      >
                        {dupId}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-800/80 space-y-2 text-xs">
                <h4 className="font-semibold text-zinc-300 text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> Sets Mais Frequentes:
                </h4>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                  {Object.entries(setCodeDistribution)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 15)
                    .map(([set_code, count]) => (
                      <span
                        key={set_code}
                        className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[11px] font-mono text-zinc-300"
                      >
                        {set_code}: <strong className="text-blue-400">{count}</strong>
                      </span>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Aba 2: Preencher TCGPlayer IDs */}
          {activeTab === 'fill-tcg' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg text-xs text-amber-300/90 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    Existem {missingTcgVariants} variante(s) em {missingTcgCards} documento(s) com TCGPlayer ID vazio.
                  </p>
                  <p className="text-[11px] text-amber-400/70 mt-0.5">
                    Esta ferramenta gera identificadores únicos para todas as variantes pendentes.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">
                    Prefixo do Identificador:
                  </label>
                  <input
                    type="text"
                    value={tcgPrefix}
                    onChange={(e) => setTcgPrefix(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                    placeholder="Ex: TCG-"
                  />
                </div>

                <label className="flex items-center gap-2 text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tcgUseCode}
                    onChange={(e) => setTcgUseCode(e.target.checked)}
                    className="rounded bg-zinc-950 border-zinc-800 text-blue-600 focus:ring-0"
                  />
                  <span>Basear identificador no código/ID da carta (Ex: {tcgPrefix}BS-004-V1)</span>
                </label>

                <button
                  type="button"
                  onClick={handleFillEmptyTcg}
                  disabled={missingTcgVariants === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-md shadow-md text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preencher Todas as {missingTcgVariants} Variantes Pendentes</span>
                </button>
              </div>
            </div>
          )}

          {/* Aba 3: Substituir Set Code */}
          {activeTab === 'set-code' && (
            <div className="space-y-3.5 text-xs">
              <p className="text-zinc-400 text-xs">
                Altera o código do set em todas as variantes correspondentes no arquivo inteiro.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Set Code Atual:</label>
                  <input
                    type="text"
                    value={fromSetCode}
                    onChange={(e) => setFromSetCode(e.target.value)}
                    placeholder="Ex: BS1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Novo Set Code:</label>
                  <input
                    type="text"
                    value={toSetCode}
                    onChange={(e) => setToSetCode(e.target.value)}
                    placeholder="Ex: BASE-01"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">
                  Novo Nome do Set (Opcional):
                </label>
                <input
                  type="text"
                  value={toSetName}
                  onChange={(e) => setToSetName(e.target.value)}
                  placeholder="Ex: Base Set Remastered"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleReplaceSetCode}
                disabled={!fromSetCode.trim() || !toSetCode.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-md shadow-md text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Aplicar Substituição Global</span>
              </button>
            </div>
          )}

          {/* Aba 4: Reajuste de Preços */}
          {activeTab === 'pricing' && (
            <div className="space-y-3.5 text-xs">
              <p className="text-zinc-400 text-xs">
                Aplica reajuste percentual a todos os preços do dataset.
              </p>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-zinc-300 font-medium block mb-1">
                    Percentual de Reajuste (%):
                  </label>
                  <input
                    type="number"
                    value={priceAdjustPercent}
                    onChange={(e) => setPriceAdjustPercent(e.target.value)}
                    placeholder="Ex: 10 ou -5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-300 font-medium block mb-1">Campos Alvo:</label>
                  <select
                    value={priceTarget}
                    onChange={(e: any) => setPriceTarget(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-blue-500"
                  >
                    <option value="both">Ambos (Market Price e Price)</option>
                    <option value="price">Apenas Price</option>
                    <option value="marketPrice">Apenas Market Price</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAdjustPrices}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-md shadow-md text-xs cursor-pointer flex items-center gap-1.5"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Aplicar Reajuste de {priceAdjustPercent}%</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

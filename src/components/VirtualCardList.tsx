import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CardDocument } from '../types/card';
import { isTcgPlayerIdEmpty } from '../utils/cardUtils';
import { AlertCircle, Layers } from 'lucide-react';

interface VirtualCardListProps {
  cards: CardDocument[];
  selectedId: string | null;
  dirtyIds: Set<string>;
  onSelectCard: (card: CardDocument) => void;
  itemHeight?: number;
}

export const VirtualCardList: React.FC<VirtualCardListProps> = ({
  cards,
  selectedId,
  dirtyIds,
  onSelectCard,
  itemHeight = 44,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Observa redimensionamento do container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    setContainerHeight(el.clientHeight || 600);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Cálculo da janela virtualizada
  const totalCount = cards.length;
  const totalHeight = totalCount * itemHeight;
  const overscan = 8;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalCount,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleCards = [];
  for (let i = startIndex; i < endIndex; i++) {
    visibleCards.push({
      index: i,
      card: cards[i],
      top: i * itemHeight,
    });
  }

  // Auto-scroll para item selecionado se necessário
  useEffect(() => {
    if (!selectedId || !containerRef.current) return;
    const index = cards.findIndex((c) => c._id === selectedId);
    if (index === -1) return;

    const targetTop = index * itemHeight;
    const currentScroll = containerRef.current.scrollTop;
    const visibleBottom = currentScroll + containerHeight;

    if (targetTop < currentScroll) {
      containerRef.current.scrollTop = targetTop;
    } else if (targetTop + itemHeight > visibleBottom) {
      containerRef.current.scrollTop = targetTop + itemHeight - containerHeight;
    }
  }, [selectedId, cards, itemHeight, containerHeight]);

  if (cards.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500">
        <Layers className="w-8 h-8 mb-2 opacity-40 text-zinc-400" />
        <p className="text-sm font-medium">Nenhuma carta encontrada</p>
        <p className="text-xs text-zinc-400 mt-1">Tente ajustar a busca ou o filtro</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto relative outline-none select-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!selectedId) return;
        const currentIndex = cards.findIndex((c) => c._id === selectedId);
        if (currentIndex === -1) return;

        if (e.key === 'ArrowDown' && currentIndex < cards.length - 1) {
          e.preventDefault();
          onSelectCard(cards[currentIndex + 1]);
        } else if (e.key === 'ArrowUp' && currentIndex > 0) {
          e.preventDefault();
          onSelectCard(cards[currentIndex - 1]);
        }
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative', width: '100%' }}>
        {visibleCards.map(({ index, card, top }) => {
          const isSelected = card._id === selectedId;
          const isDirty = dirtyIds.has(card._id);
          const varCount = card.variants?.length || 0;
          const hasEmptyTcg = card.variants?.some((v) => isTcgPlayerIdEmpty(v)) || varCount === 0;
          const cardId = card.id || card.code || '-';

          return (
            <div
              key={card._id}
              onClick={() => onSelectCard(card)}
              style={{
                position: 'absolute',
                top: `${top}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`,
              }}
              className={`flex items-center px-3 border-b border-zinc-800/40 cursor-pointer transition-colors text-xs ${
                isSelected
                  ? 'bg-blue-600/20 text-blue-200 border-l-4 border-l-blue-500 font-medium'
                  : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
              title={`${card.name || 'Sem nome'} · ${cardId} · ${varCount} var.`}
            >
              {/* Indicador de Modificado */}
              {isDirty ? (
                <span
                  title="Modificado (não exportado)"
                  className="w-2 h-2 rounded-full bg-amber-400 mr-2 flex-shrink-0 animate-pulse"
                />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600/50 mr-2 flex-shrink-0" />
              )}

              {/* Nome e Código */}
              <div className="flex-1 truncate pr-2 flex items-center gap-1.5 min-w-0">
                <span className="truncate font-medium text-zinc-100">
                  {card.name || 'Sem nome'}
                </span>
                <span className="text-zinc-400 text-[11px] truncate flex-shrink-0">
                  · {cardId}
                </span>
              </div>

              {/* Tags / Variantes */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {hasEmptyTcg && (
                  <span
                    title="Contém variante com TCGPlayer ID vazio"
                    className="flex items-center text-amber-400/90 text-[10px]"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                  </span>
                )}
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isSelected
                      ? 'bg-blue-500/30 text-blue-200'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {varCount} var.
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

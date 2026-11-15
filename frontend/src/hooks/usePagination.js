import { useState } from 'react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Client-side pagination over an in-memory list.
 * Goes back to the first page whenever the list itself changes (new filters, reload).
 *
 * @template T
 * @param {T[]} items
 * @param {number} [initialPageSize]
 */
export function usePagination(items, initialPageSize = PAGE_SIZE_OPTIONS[0]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [previousItems, setPreviousItems] = useState(items);

  if (items !== previousItems) {
    setPreviousItems(items);
    setPage(1);
  }

  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const startIndex = (currentPage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  function goToPage(nextPage) {
    setPage(Math.min(Math.max(1, nextPage), pageCount));
  }

  function changePageSize(nextSize) {
    setPageSize(nextSize);
    setPage(1);
  }

  return {
    page: currentPage,
    pageSize,
    pageCount,
    total,
    startIndex,
    pageItems,
    goToPage,
    changePageSize
  };
}

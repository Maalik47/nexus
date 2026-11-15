import { PAGE_SIZE_OPTIONS } from '../hooks/usePagination.js';

/**
 * Pager for report tables. Receives the object returned by usePagination.
 */
export default function Pagination({ pagination, label = 'Paginación de la tabla' }) {
  const { page, pageSize, pageCount, total, startIndex, goToPage, changePageSize } = pagination;

  if (total === 0) return null;

  const firstRow = startIndex + 1;
  const lastRow = Math.min(startIndex + pageSize, total);

  return (
    <nav className="pagination" aria-label={label}>
      <span className="pagination__info">
        Mostrando {firstRow}–{lastRow} de {total}
      </span>

      <div className="pagination__controls">
        <label className="pagination__size">
          Filas por página
          <select
            value={pageSize}
            onChange={(event) => changePageSize(Number(event.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
        >
          ‹ Anterior
        </button>
        <span className="pagination__page" aria-live="polite">
          Página {page} de {pageCount}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === pageCount}
        >
          Siguiente ›
        </button>
      </div>
    </nav>
  );
}

import React, { useState, useMemo } from "react";
import SkeletonTable from "./SkeletonTable.jsx";
import EmptyStateCard from "./EmptyStateCard.jsx";

/**
 * Standardized responsive DataTable for Nivora Care HMS.
 * Features search filtering, column sorting, pagination, and empty/loading states.
 */
export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = "Search records...",
  searchKeys = [],
  pagination = true,
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyTitle = "No records found",
  emptySubtitle = "There are currently no items matching your criteria.",
  onRowClick,
  keyExtractor = (row, index) => row._id || row.id || index,
  toolbarExtra,
  className = "",
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Filtered data based on search input
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase().trim();

    return data.filter((item) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((k) => {
          const val = item[k];
          return val != null && String(val).toLowerCase().includes(query);
        });
      }

      return columns.some((col) => {
        const val = item[col.key];
        return val != null && String(val).toLowerCase().includes(query);
      });
    });
  }, [data, search, searchKeys, columns]);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortOrder === "asc"
        ? strA.localeCompare(strB)
        : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginated data
  const totalItems = sortedData.length;
  const totalPages = pagination ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const handleSort = (colKey) => {
    if (sortKey === colKey) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(colKey);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  return (
    <div className={`liquid-glass rounded-2xl overflow-hidden border-0 shadow-sm ${className}`}>
      {/* Top Toolbar */}
      {(searchable || toolbarExtra) && (
        <div className="p-4 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                aria-label={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/25 focus:ring-offset-1 focus:border-teal-600 transition-[border-color,box-shadow,background-color] duration-150 ease-out"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 text-xs active:scale-95 transition-transform"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {toolbarExtra && <div className="flex items-center gap-2">{toolbarExtra}</div>}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={pageSize > 10 ? 10 : pageSize} cols={columns.length || 5} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="py-8 animate-pop-in">
            <EmptyStateCard
              title={emptyTitle}
              description={search ? `No results found for "${search}". Try adjusting your filters.` : emptySubtitle}
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                {columns.map((col) => {
                  const isSortable = col.sortable !== false;
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width }}
                      aria-sort={isSorted ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                      className={`px-4 py-3.5 font-semibold ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${isSortable ? "cursor-pointer select-none hover:text-slate-900 transition-colors duration-150" : ""}`}
                    >
                      {isSortable ? (
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg text-inherit transition-colors duration-150 ease-out hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}
                          aria-label={`Sort by ${col.header}${isSorted ? (sortOrder === "asc" ? ", ascending" : ", descending") : ""}`}
                        >
                          <span>{col.header}</span>
                          <span className="text-[10px] text-slate-400" aria-hidden="true">
                            {isSorted ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                          </span>
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row, idx) => {
                const rowKey = keyExtractor(row, idx);
                const isClickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`${isClickable ? "cursor-pointer hover:bg-teal-50/40 active:bg-teal-50/70" : "hover:bg-slate-50/60"}`}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3.5 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}`}
                      >
                        {col.render ? col.render(row[col.key], row, idx) : row[col.key] != null ? String(row[col.key]) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      {pagination && !loading && totalItems > 0 && (
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/40">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="ml-2">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} records
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="liquid-glass-pill px-3 py-1.5 disabled:opacity-40 rounded-xl transition text-slate-700 active:scale-[0.97] shadow-xs"
            >
              Previous
            </button>
            <span className="px-2 text-slate-600 font-medium font-mono text-xs tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="liquid-glass-pill px-3 py-1.5 disabled:opacity-40 rounded-xl transition text-slate-700 active:scale-[0.97] shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };

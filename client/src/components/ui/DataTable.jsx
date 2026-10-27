import React, { useState, useMemo, useRef, useEffect } from "react";
import SkeletonTable from "./SkeletonTable.jsx";
import EmptyStateCard from "./EmptyStateCard.jsx";

/**
 * Standardized responsive DataTable for Nivora Care HMS.
 * Features search filtering, column sorting, pagination, and empty/loading states.
 * Row stagger animations with proper interruptible transitions.
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
  const [rowMounted, setRowMounted] = useState({});
  const tbodyRef = useRef(null);

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

  // Trigger row stagger animation when data changes
  useEffect(() => {
    const mounted = {};
    paginatedData.forEach((_, idx) => {
      mounted[idx] = true;
    });
    setRowMounted(mounted);
  }, [paginatedData, currentPage]);

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
    <div className={`liquid-glass rounded-2xl overflow-hidden ${className}`}>
      {/* Top Toolbar */}
      {(searchable || toolbarExtra) && (
        <div className="p-4 border-b border-slate-100/80 bg-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchable ? (
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full liquid-glass-subtle rounded-xl px-3.5 py-2 pl-9 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:ring-offset-2 transition duration-150"
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
              subtitle={search ? `No results found for "${search}". Try adjusting your filters.` : emptySubtitle}
            />
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/60">
              <tr>
                {columns.map((col) => {
                  const isSortable = col.sortable !== false;
                  const isSorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      onClick={() => isSortable && handleSort(col.key)}
                      style={{ width: col.width }}
                      className={`px-4 py-3.5 font-semibold ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"} ${isSortable ? "cursor-pointer select-none hover:text-slate-900 transition-colors duration-150" : ""}`}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : "justify-start"}`}>
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="text-[10px] text-slate-400 transition-transform duration-150 ease-out">
                            {isSorted ? (sortOrder === "asc" ? "▲" : "▼") : "⇅"}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody ref={tbodyRef} className="divide-y divide-slate-100">
              {paginatedData.map((row, idx) => {
                const rowKey = keyExtractor(row, idx);
                const isClickable = Boolean(onRowClick);
                const isMounted = rowMounted[idx];
                return (
                  <tr
                    key={rowKey}
                    style={{ animationDelay: `${Math.min(idx * 25, 200)}ms` }}
                    onClick={() => isClickable && onRowClick(row)}
                    className={`transition-colors duration-150 ease-out ${isMounted ? "animate-row-stagger" : ""} ${isClickable ? "cursor-pointer hover:bg-slate-50/80 active:bg-slate-100/60" : "hover:bg-slate-50/40"}`}
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
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/30">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
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

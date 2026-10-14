import { useMemo, useState, useRef, useEffect } from "react";
import TableRow from "./TableRow";

export default function Table({
  columns,
  data,
  defaultRows = 10,
}) {

  

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRows);

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));

  // FIX: page was reset to 1 via a useEffect watching rowsPerPage, but
  // handleRowsChange (the only place rowsPerPage actually changes) already
  // resets page itself - the effect was redundant and just caused an extra
  // render (and tripped the react-hooks/set-state-in-effect lint rule).

  const currentData = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, page, rowsPerPage]);

    
  const handleRowsChange = (e) => {
    const value = Number(e.target.value);
    if (value > 0) {
      setRowsPerPage(value);
      setPage(1);
    }
  };

  const tableScrollRef = useRef(null); // the real table (scrolls x + y)
  const bottomScrollRef = useRef(null); // the fake fixed scrollbar
  const spacerRef = useRef(null); // invisible div matching table's full width
  const isSyncingRef = useRef(false); // guards against infinite scroll-event ping-pong

  const [bar, setBar] = useState({ left: 0, width: 0, show: false });

  // Keep the fixed scrollbar's size/position/visibility matched to the table
  useEffect(() => {
    const table = tableScrollRef.current;
    if (!table) return;

    const update = () => {
      const rect = table.getBoundingClientRect();
      setBar({
        left: rect.left,
        width: rect.width,
        show: table.scrollWidth > table.clientWidth,
      });
      if (spacerRef.current) {
        spacerRef.current.style.width = `${table.scrollWidth}px`;
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(table);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true); // page scroll can move table's rect.left

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [currentData, columns]);

  const syncFromTable = () => {
    if (
      isSyncingRef.current ||
      !bottomScrollRef.current ||
      !tableScrollRef.current
    )
      return;
    isSyncingRef.current = true;
    bottomScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    isSyncingRef.current = false;
  };

  const syncFromBar = () => {
    if (
      isSyncingRef.current ||
      !bottomScrollRef.current ||
      !tableScrollRef.current
    )
      return;
    isSyncingRef.current = true;
    tableScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    isSyncingRef.current = false;
  };

  return (
    <>
      <div className="border border-gray-300 bg-white overflow-hidden">
        <div
          ref={tableScrollRef}
          onScroll={syncFromTable}
          className="overflow-y-auto overflow-x-auto"
        >
          <table className="min-w-max w-full">
            <thead className="bg-gray-300 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-5 py-4 text-left whitespace-nowrap"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {currentData.map((row, index) => (
                <TableRow key={row.id || index} row={row} columns={columns} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed horizontal scrollbar pinned to the bottom of the viewport */}
      {bar.show && (
        <div
          ref={bottomScrollRef}
          onScroll={syncFromBar}
          className="fixed bottom-0 overflow-x-auto overflow-y-hidden z-30 bg-white border-t border-gray-300"
          style={{ left: bar.left, width: bar.width, height: 16 }}
        >
          <div ref={spacerRef} style={{ height: 1 }} />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mt-4 p-2">
        <div className="flex items-center gap-2">
          <label>Rows:</label>
          <input
            type="number"
            min={1}
            value={rowsPerPage}
            onChange={handleRowsChange}
            className="w-20 border border-gray-400 rounded px-2 py-1"
          />
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="border border-gray-400 px-3 py-1 bg-gray-200 rounded disabled:opacity-80"
          >
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-gray-400 px-3 py-1 bg-gray-200 rounded disabled:opacity-80"
          >
            Next
          </button>
        </div>
      </div>
    </>
  );
}
export default function TableRow({ row, columns }) {
  return (
    <tr className="border-t border-gray-300 hover:bg-gray-200">
      {columns.map((column) => (
        <td key={column.key} className="px-5 py-4 text-left whitespace-nowrap">
          {column.render
            ? column.render(row[column.key], row)
            : row[column.key]}
        </td>
      ))}
    </tr>
  );
}

import React from 'react';
import styles from './Table.module.css';

function Table({ columns = [], data = [], onRowClick, compact = false, className = '' }) {
  const tableClasses = [
    styles.table,
    compact ? styles.compact : '',
    onRowClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.tableWrap}>
      <table className={tableClasses}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

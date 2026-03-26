import React from 'react';
import styles from './DetailTable.module.css';

function DetailTable({ rows = [] }) {
  return (
    <table className={styles.dtbl}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td className={styles.dtblLabel}>{row.label}</td>
            <td className={styles.dtblValue}>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default DetailTable;

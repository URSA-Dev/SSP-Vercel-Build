import React, { useRef } from 'react';
import styles from './Tabs.module.css';

function Tabs({ tabs = [], activeKey, onChange }) {
  const tabListRef = useRef(null);

  function handleKeyDown(e) {
    const tabKeys = tabs.map((t) => t.key);
    const currentIndex = tabKeys.indexOf(activeKey);
    let nextIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    onChange?.(tabKeys[nextIndex]);
    // Focus the newly active tab button
    const buttons = tabListRef.current?.querySelectorAll('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  }

  return (
    <div className={styles.tabs} role="tablist" ref={tabListRef}>
      {tabs.map((t) => (
        <button
          key={t.key}
          id={`tab-${t.key}`}
          role="tab"
          aria-selected={activeKey === t.key}
          aria-controls={`tabpanel-${t.key}`}
          tabIndex={activeKey === t.key ? 0 : -1}
          className={[styles.tab, activeKey === t.key ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onChange?.(t.key)}
          onKeyDown={handleKeyDown}
        >
          {t.label}
          {t.count != null && <span className={styles.tabCount}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function TabPanel({ id, activeKey, children }) {
  const isActive = id === activeKey;
  return (
    <div
      role="tabpanel"
      id={`tabpanel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
    >
      {isActive ? children : null}
    </div>
  );
}

export default Tabs;

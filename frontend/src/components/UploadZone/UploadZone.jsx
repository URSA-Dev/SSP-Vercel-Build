import React, { useRef, useState, useCallback } from 'react';
import styles from './UploadZone.module.css';

function UploadZone({
  onUpload,
  accept,
  maxSize,
  title = 'Drop files here or click to upload',
  subtitle,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback((files) => {
    if (!files?.length) return;
    const fileList = Array.from(files);
    const filtered = maxSize
      ? fileList.filter((f) => f.size <= maxSize)
      : fileList;
    onUpload?.(filtered);
  }, [onUpload, maxSize]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const zoneClasses = [
    styles.uploadZone,
    dragOver ? styles.dragOver : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={zoneClasses}
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
    >
      <div className={styles.uzIcon}>&#128230;</div>
      <div className={styles.uzTitle}>{title}</div>
      {subtitle && <div className={styles.uzSub}>{subtitle}</div>}
      <input
        ref={inputRef}
        className={styles.uzInput}
        type="file"
        accept={accept}
        multiple
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}

export default UploadZone;

import React, { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import Select from '../FormControls/Select';
import UploadZone from '../UploadZone/UploadZone';
import { DOC_TYPES } from '../../utils/constants';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function UploadDocModal({ isOpen, onClose, onSubmit }) {
  const [files, setFiles] = useState([]);
  const [docType, setDocType] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setDocType('');
    }
  }, [isOpen]);

  const docTypeOptions = DOC_TYPES.map((t) => ({ value: t, label: t }));

  const handleUpload = (uploadedFiles) => {
    setFiles(uploadedFiles);
  };

  const isValid = files.length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit?.({ files, docType });
  };

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>Cancel</Button>
      <Button variant="primary" disabled={!isValid} onClick={handleSubmit}>
        Upload &amp; Begin AI Extraction
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Document"
      subtitle="Upload a document for AI-powered extraction and classification"
      footer={footer}
    >
      <UploadZone
        onUpload={handleUpload}
        maxSize={MAX_FILE_SIZE}
        title="Drop files here or click to upload"
        subtitle="PDF, DOCX, JPG, PNG — Max 50 MB"
      />

      {files.length > 0 && (
        <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--ink-light, #6b7280)' }}>
          {files.map((f, i) => (
            <div key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</div>
          ))}
        </div>
      )}

      <Select
        label="Document Type"
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
        options={docTypeOptions}
        hint="If blank, AI will attempt to classify"
      />
    </Modal>
  );
}

export default UploadDocModal;

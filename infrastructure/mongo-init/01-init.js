/**
 * MongoDB Initialization Script
 * Creates collections, indexes, and validation for SSP Document Management.
 * Runs automatically on first container start via /docker-entrypoint-initdb.d/
 */

// Switch to the SSP documents database
db = db.getSiblingDB('ssp_documents');

// -----------------------------------------------------------
// Collection: documents
// Main document metadata + extraction results + GridFS ref
// -----------------------------------------------------------
db.createCollection('documents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['pg_document_id', 'pg_case_id', 'original_filename', 'status', 'created_at'],
      properties: {
        pg_document_id: {
          bsonType: 'string',
          description: 'UUID reference to PostgreSQL case_documents.id'
        },
        pg_case_id: {
          bsonType: 'string',
          description: 'UUID reference to PostgreSQL cases.id'
        },
        original_filename: {
          bsonType: 'string',
          description: 'Original uploaded filename'
        },
        mime_type: { bsonType: 'string' },
        file_size_bytes: { bsonType: 'long' },
        gridfs_file_id: { bsonType: 'objectId' },
        checksum_sha256: { bsonType: 'string' },
        doc_type: { bsonType: 'string' },
        classification_confidence: {
          bsonType: 'double',
          minimum: 0,
          maximum: 1
        },
        classification_model: { bsonType: 'string' },
        tags: {
          bsonType: 'array',
          items: { bsonType: 'string' }
        },
        category: {
          bsonType: 'string',
          enum: ['INTAKE', 'INVESTIGATION', 'ADJUDICATION', 'CORRESPONDENCE', 'TEMPLATE']
        },
        version: { bsonType: 'int', minimum: 1 },
        is_latest: { bsonType: 'bool' },
        parent_document_id: { bsonType: 'objectId' },
        version_note: { bsonType: 'string' },
        extraction: {
          bsonType: 'object',
          properties: {
            processor_id: { bsonType: 'string' },
            processor_version: { bsonType: 'string' },
            extracted_at: { bsonType: 'date' },
            raw_text: { bsonType: 'string' },
            overall_confidence: { bsonType: 'double' },
            pages: { bsonType: 'array' },
            fields: { bsonType: 'array' },
            tables: { bsonType: 'array' },
            entities: { bsonType: 'array' }
          }
        },
        access: {
          bsonType: 'object',
          properties: {
            owner_id: { bsonType: 'string' },
            visibility: {
              bsonType: 'string',
              enum: ['CASE_TEAM', 'ASSIGNED_ONLY', 'ALL_CLEARED', 'ADMIN']
            },
            permitted_users: { bsonType: 'array' },
            permitted_roles: { bsonType: 'array' },
            classification_level: {
              bsonType: 'string',
              enum: ['UNCLASSIFIED', 'CUI', 'FOUO']
            }
          }
        },
        status: {
          bsonType: 'string',
          enum: ['UPLOADED', 'PROCESSING', 'EXTRACTED', 'VALIDATED', 'FAILED']
        },
        processing_errors: { bsonType: 'array' },
        deleted_at: { bsonType: 'date' },
        deleted_by: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
        created_by: { bsonType: 'string' },
        updated_by: { bsonType: 'string' }
      }
    }
  }
});

// Documents indexes
db.documents.createIndex({ pg_document_id: 1 }, { unique: true, name: 'idx_pg_document_id' });
db.documents.createIndex({ pg_case_id: 1, is_latest: 1 }, { name: 'idx_case_latest' });
db.documents.createIndex({ doc_type: 1, status: 1 }, { name: 'idx_doc_type_status' });
db.documents.createIndex({ tags: 1 }, { name: 'idx_tags' });
db.documents.createIndex(
  { 'extraction.raw_text': 'text', original_filename: 'text', 'extraction.fields.field_value': 'text' },
  { name: 'idx_fulltext_search', weights: { 'extraction.raw_text': 5, original_filename: 3, 'extraction.fields.field_value': 2 } }
);
db.documents.createIndex({ parent_document_id: 1, version: -1 }, { name: 'idx_version_chain' });
db.documents.createIndex({ created_at: -1 }, { name: 'idx_created_at' });
db.documents.createIndex({ deleted_at: 1 }, { partialFilterExpression: { deleted_at: null }, name: 'idx_active_docs' });
db.documents.createIndex({ 'access.classification_level': 1 }, { name: 'idx_classification' });
db.documents.createIndex({ 'extraction.overall_confidence': 1, status: 1 }, { name: 'idx_confidence_status' });

// -----------------------------------------------------------
// Collection: document_audit_trail (append-only)
// -----------------------------------------------------------
db.createCollection('document_audit_trail', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['document_id', 'action', 'actor_id', 'actor_type', 'created_at'],
      properties: {
        document_id: { bsonType: 'objectId' },
        pg_document_id: { bsonType: 'string' },
        pg_case_id: { bsonType: 'string' },
        action: {
          bsonType: 'string',
          enum: [
            'UPLOAD', 'VIEW', 'DOWNLOAD', 'EXTRACT', 'VALIDATE_FIELD',
            'RECLASSIFY', 'VERSION_CREATE', 'DELETE', 'RESTORE',
            'ACCESS_GRANT', 'ACCESS_REVOKE', 'PRINT'
          ]
        },
        actor_id: { bsonType: 'string' },
        actor_type: {
          bsonType: 'string',
          enum: ['USER', 'AI_AGENT', 'SYSTEM']
        },
        ip_address: { bsonType: 'string' },
        details: { bsonType: 'object' },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

// Audit trail indexes
db.document_audit_trail.createIndex({ document_id: 1, created_at: -1 }, { name: 'idx_doc_audit_timeline' });
db.document_audit_trail.createIndex({ pg_case_id: 1, created_at: -1 }, { name: 'idx_case_audit_timeline' });
db.document_audit_trail.createIndex({ actor_id: 1, action: 1 }, { name: 'idx_actor_action' });
db.document_audit_trail.createIndex({ created_at: -1 }, { name: 'idx_audit_created' });

// -----------------------------------------------------------
// Collection: document_templates (forms library)
// -----------------------------------------------------------
db.createCollection('document_templates', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'code', 'category', 'is_active'],
      properties: {
        name: { bsonType: 'string' },
        code: { bsonType: 'string' },
        description: { bsonType: 'string' },
        category: {
          bsonType: 'string',
          enum: ['INTAKE_FORM', 'GOVERNMENT_FORM', 'INTERNAL_TEMPLATE', 'LETTER']
        },
        version: { bsonType: 'string' },
        gridfs_file_id: { bsonType: 'objectId' },
        mime_type: { bsonType: 'string' },
        file_size_bytes: { bsonType: 'long' },
        expected_fields: {
          bsonType: 'array',
          items: {
            bsonType: 'object',
            properties: {
              field_name: { bsonType: 'string' },
              field_label: { bsonType: 'string' },
              field_type: {
                bsonType: 'string',
                enum: ['TEXT', 'DATE', 'SSN', 'BOOLEAN', 'ENUM', 'NUMBER', 'ADDRESS']
              },
              required: { bsonType: 'bool' },
              validation_regex: { bsonType: 'string' },
              pg_column_mapping: { bsonType: 'string' },
              page_number: { bsonType: 'int' },
              position_hint: { bsonType: 'object' }
            }
          }
        },
        processor_config: {
          bsonType: 'object',
          properties: {
            processor_id: { bsonType: 'string' },
            processor_type: {
              bsonType: 'string',
              enum: ['FORM_PARSER', 'OCR', 'CUSTOM']
            },
            post_processing_rules: { bsonType: 'array' }
          }
        },
        is_active: { bsonType: 'bool' },
        created_by: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Template indexes
db.document_templates.createIndex({ code: 1 }, { unique: true, name: 'idx_template_code' });
db.document_templates.createIndex({ category: 1, is_active: 1 }, { name: 'idx_template_category' });

// -----------------------------------------------------------
// Application user (read-write, non-root)
// -----------------------------------------------------------
db.createUser({
  user: 'ssp_app',
  pwd: 'ssp_docstore_2026',
  roles: [
    { role: 'readWrite', db: 'ssp_documents' }
  ]
});

print('SSP Document Management — MongoDB initialized successfully');
print('Collections: documents, document_audit_trail, document_templates');
print('Application user: ssp_app (readWrite on ssp_documents)');

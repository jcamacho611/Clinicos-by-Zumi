-- Migration: Add Compliance & Audit Schemas
-- Purpose: Support gating, consent logging, and audit trails
-- Date: 2026-08-10

-- UserAcceptance: Log all terms/policy acceptances
CREATE TABLE user_acceptances (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  term_version TEXT NOT NULL,
  accepted_text TEXT,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
);

-- UserAuditLog: Track security and compliance events
CREATE TABLE user_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id_action (user_id, action),
  INDEX idx_timestamp (timestamp)
);

-- UserPreference: Store consent/preference settings
CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  analytics_consent BOOLEAN DEFAULT FALSE,
  marketing_consent BOOLEAN DEFAULT FALSE,
  cookie_preference JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- LegalDocument: Store versioned legal agreements
CREATE TABLE legal_documents (
  id SERIAL PRIMARY KEY,
  doc_type TEXT NOT NULL,
  version TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  effective_at TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_doc_type_version (doc_type, version),
  UNIQUE(doc_type, version)
);

-- ApplicationRequest: Track pending clinic applications
CREATE TABLE application_requests (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  organization_name TEXT,
  clinic_type TEXT,
  intended_use TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by TEXT,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status_created (status, created_at)
);

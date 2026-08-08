-- Migration 023: Soft-delete for client_contacts
-- Allows contacts to be hidden from active lists when deleted,
-- while preserving their name and details on historical quotes and sales.

ALTER TABLE client_contacts ADD COLUMN is_deleted TINYINT NOT NULL DEFAULT 0;

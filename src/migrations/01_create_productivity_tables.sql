-- Migration 01: Create productivity tables and soft delete columns

-- Ensure soft-delete columns exist on documents
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedBy" UUID NULL;
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "deletedReason" VARCHAR(255) NULL;

-- Create tags table
CREATE TABLE IF NOT EXISTS "tags" (
  "id" UUID PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create favorite_documents table
CREATE TABLE IF NOT EXISTS "favorite_documents" (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE("userId", "documentId")
);

-- Create pinned_documents table
CREATE TABLE IF NOT EXISTS "pinned_documents" (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE("userId", "documentId")
);

-- Create document_tags table
CREATE TABLE IF NOT EXISTS "document_tags" (
  "id" UUID PRIMARY KEY,
  "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "tagId" UUID NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE("documentId", "tagId")
);

-- Create user_document_activity table
CREATE TABLE IF NOT EXISTS "user_document_activity" (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "documentId" UUID NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
  "lastOpenedAt" TIMESTAMP WITH TIME ZONE NULL,
  "lastEditedAt" TIMESTAMP WITH TIME ZONE NULL,
  "lastViewedAt" TIMESTAMP WITH TIME ZONE NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE("userId", "documentId")
);

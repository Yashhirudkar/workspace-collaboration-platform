import { NextRequest } from 'next/server';
import { getUserIdFromRequest } from './auth';
import DocumentCollaborator from '../models/DocumentCollaborator';
import { DocumentRole } from '../constants/roles';
import { ForbiddenError, NotFoundError } from '../utils/errors';

export async function checkDocumentRole(req: NextRequest, documentId: string, requiredRoles: DocumentRole[]) {
  const userId = getUserIdFromRequest(req);

  const collab = await DocumentCollaborator.findOne({
    where: { userId, documentId },
  });

  if (!collab) {
    throw new NotFoundError('Document not found or access denied');
  }

  if (!requiredRoles.includes(collab.role)) {
    throw new ForbiddenError(`Requires one of roles: ${requiredRoles.join(', ')}`);
  }

  return { userId, role: collab.role };
}

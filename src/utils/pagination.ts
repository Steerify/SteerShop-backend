import { PaginationMeta, PaginationParams } from '../types';

export const calculatePagination = (
  page: number = 1,
  limit: number = 10
): { skip: number; take: number } => {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
};

export const generatePaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

export const parsePaginationParams = (query: any): PaginationParams => {
  return {
    page: query.page ? parseInt(query.page, 10) : 1,
    limit: query.limit ? parseInt(query.limit, 10) : 10,
  };
};

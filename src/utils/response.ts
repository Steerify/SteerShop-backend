import { Response } from 'express';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../types';

export const successResponse = <T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
};

export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: message,
    ...(errors && { errors }),
  };
  return res.status(statusCode).json(response);
};

export const paginatedResponse = <T>(
  res: Response,
  data: T,
  meta: PaginationMeta,
  message: string = 'Success'
): Response => {
  const response: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    meta,
  };
  return res.status(200).json(response);
};

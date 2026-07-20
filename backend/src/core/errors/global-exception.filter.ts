import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from './app-error';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = this.buildErrorResponse(exception, request);

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `[${errorResponse.code}] ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `[${errorResponse.code}] ${errorResponse.message} — ${request.method} ${request.url}`,
      );
    }

    response.status(errorResponse.statusCode).json(errorResponse);
  }

  private buildErrorResponse(
    exception: unknown,
    request: Request,
  ): ErrorResponse {
    const path = request.url;
    const timestamp = new Date().toISOString();

    // 1. Our domain AppError subclasses
    if (exception instanceof AppError) {
      return {
        statusCode: exception.statusCode,
        code: exception.code,
        message: exception.message,
        path,
        timestamp,
      };
    }

    // 2. NestJS HttpException (validation pipe, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'object' && body !== null && 'message' in body
          ? Array.isArray((body as Record<string, unknown>).message)
            ? ((body as Record<string, unknown>).message as string[]).join('; ')
            : String((body as Record<string, unknown>).message)
          : exception.message;

      return {
        statusCode: status,
        code: status === 400 ? 'VALIDATION_ERROR' : 'HTTP_ERROR',
        message,
        path,
        timestamp,
      };
    }

    // 3. Prisma known errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const fields = (
          exception.meta as Record<string, string[]> | undefined
        )?.target?.join(', ');
        return {
          statusCode: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: fields
            ? `A record with this ${fields} already exists`
            : 'A record with these values already exists',
          path,
          timestamp,
        };
      }

      if (exception.code === 'P2025') {
        return {
          statusCode: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Record not found',
          path,
          timestamp,
        };
      }

      if (exception.code === 'P2003') {
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          code: 'BAD_REQUEST',
          message: 'Related record not found',
          path,
          timestamp,
        };
      }
    }

    // 4. Fallback — 500
    const isProduction = process.env.NODE_ENV === 'production';
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: isProduction
        ? 'An unexpected error occurred'
        : exception instanceof Error
          ? exception.message
          : 'Unknown error',
      path,
      timestamp,
    };
  }
}

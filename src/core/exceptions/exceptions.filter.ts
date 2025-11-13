import {
  ExceptionFilter as NestExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import pluralize from 'pluralize';
import _ from 'lodash';

export interface HttpExceptionResponse {
  statusCode: string;
  message: string | string[];
  error?: string;
}

type DuplicateKeyError = MongoServerError & {
  code: 11000;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
  errorMessage?: string;
};

@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  private readonly logger = new Logger(ExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const exceptionStatus = (exception.getStatus?.() as HttpStatus) ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const exceptionResponse = exception.getResponse() as HttpExceptionResponse;
      const exceptionResponseMessage = exceptionResponse.message;
      const formattedExceptionResponseMessage = Array.isArray(exceptionResponseMessage)
        ? exceptionResponseMessage.join(', ')
        : exceptionResponseMessage;

      response.status(exceptionStatus).json(exceptionResponse);

      if (exceptionStatus >= HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logger.error(
          `${request.method} ${request.url} ${exceptionStatus} - ${formattedExceptionResponseMessage}`,
          exception.stack,
        );
      } else {
        this.logger.debug(
          `${request.method} ${request.url} ${exceptionStatus} - ${formattedExceptionResponseMessage}`,
          exception.stack,
        );
      }
    } else if ((exception as MongoServerError).code === 11000) {
      const duplicateError = exception as DuplicateKeyError;

      const errors: Record<string, string> = {};

      if (duplicateError.keyPattern) {
        Object.keys(duplicateError.keyPattern).forEach(key => {
          errors[key] = `The ${_.lowerCase(key)} you've entered is already taken.`;
        });

        const errorsKeys = Object.keys(errors);

        response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: `The following ${pluralize('field', errorsKeys.length)}: ${errorsKeys.join(', ')} that you've entered is already taken.`,
          error: 'DuplicateKeyError',
        });

        return this.logger.error(
          `${request.method} ${request.url} ${HttpStatus.BAD_REQUEST} - Duplicate key: ${errorsKeys.join(', ')}`,
          duplicateError.stack,
        );
      }

      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: duplicateError.errorMessage ?? 'Duplicate key error',
        error: 'DuplicateKeyError',
      });
    } else if (exception instanceof Error) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });

      this.logger.error(
        `${request.method} ${request.url} ${HttpStatus.INTERNAL_SERVER_ERROR} - ${
          exception.message ? exception.message : 'Internal server error'
        }`,
        exception.stack,
      );
    } else {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });

      this.logger.error(`${request.method} ${request.url} ${HttpStatus.INTERNAL_SERVER_ERROR} - Internal server error`);
    }
  }
}

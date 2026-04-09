import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const requestId = request.headers['x-request-id'] || 'N/A';

    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - Status: ${status} - Error: ${JSON.stringify(
        exceptionResponse,
      )}`,
      exception instanceof Error ? exception.stack : '',
    );

    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
        message = (exceptionResponse as { message: string | string[] }).message;
    } else {
        message = JSON.stringify(exceptionResponse);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      requestId,
    });
  }
}

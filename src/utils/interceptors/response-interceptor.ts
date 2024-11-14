import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthDTO } from '../auth/auth-decarator';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
  accessToken?: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((res: unknown) => this.responseHandler(res, context)),
      catchError((err: unknown) =>
        throwError(() => this.errorHandler(err, context)),
      ),
    );
  }

  errorHandler(exception: unknown, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const auth: AuthDTO = context.switchToHttp().getRequest().user;

    let status: number;
    let body: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      body = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      body = {
        statusCode: status,
        message:
          exception instanceof Error
            ? exception.message
            : 'Internal server error',
      };
    }

    Logger.error(
      `[${context.getClass().name}] Status : ${status} | User : ${
        auth ? auth.email : undefined
      } | [${JSON.stringify(body)}]`,
    );
    Logger.error(
      `[${context.getClass().name}] Status : ${status} | User : ${
        auth ? auth.email : undefined
      }  | [${JSON.stringify(
        exception instanceof Error
          ? exception.stack
          : 'No stack trace available',
      )}]`,
    );

    response.status(status).json(body);
  }

  responseHandler(res: any, context: ExecutionContext) {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    const statusCode = response.statusCode;

    return {
      statusCode: statusCode || HttpStatus.OK,
      message: response.message || 'OK',
      data: res !== null ? res : null,
      accessToken: response.accessToken,
    };
  }
}

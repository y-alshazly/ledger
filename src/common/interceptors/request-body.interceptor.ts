import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';
import { Observable } from 'rxjs';

export const InterceptRequestBody = () => {
  return UseInterceptors(new RequestBodyInterceptor());
};

export class RequestBodyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe();
  }
}

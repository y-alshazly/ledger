import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors, Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { map, Observable } from 'rxjs';

export const InterceptResponseBody = <T>(dto: Type<T>) => {
  return UseInterceptors(new ResponseBodyInterceptor<T>(dto));
};

export class ResponseBodyInterceptor<T> implements NestInterceptor<unknown, T> {
  constructor(private readonly dto: Type<T>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<T> {
    return next.handle().pipe(
      map((data: unknown) =>
        plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        }),
      ),
    );
  }
}

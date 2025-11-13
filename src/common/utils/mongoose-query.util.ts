import { QueryOptionsDto } from '../dto/query-options.dto';

export function buildMongooseQueryOptions(query: QueryOptionsDto) {
  let fields: string | undefined;
  let sort: Record<string, 1 | -1> = { createdAt: -1 };

  if (query.fields) {
    fields = query.fields.replace(/,/g, ' ');
  }

  if (query.sortBy) {
    const parts = query.sortBy.split(':');
    if (parts[1]) {
      const direction = parts[1].toLowerCase() === 'desc' ? -1 : 1;
      sort = { [parts[0]]: direction };
    }
  }

  return {
    fields,
    limit: query.limit ? Number(query.limit) : 10,
    skip: query.skip ? Number(query.skip) : 0,
    sort,
  };
}

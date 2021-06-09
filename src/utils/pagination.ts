type PaginationKey =
    | 'limit'
    | 'skip';
type PartialList = Partial<Record<PaginationKey , number>>;

type Pagination = {
  limit: number
  skip: number
}

export const PAGINATION_DEFAULT_LIMIT = 20
export const PAGINATION_MAX_LIMIT = 100

export function initPagination<T extends PartialList>(args?: T): Pagination & T {
  let limit = args?.limit || PAGINATION_DEFAULT_LIMIT;
  let skip = args?.skip || 0;

  switch (true) {
    case limit < 0: {
      limit = PAGINATION_DEFAULT_LIMIT;
      break;
    }
    case limit > PAGINATION_MAX_LIMIT: {
      limit = PAGINATION_MAX_LIMIT;
      break;
    }
  }

  if (skip < 0) {
    skip = 0
  }

  
  return { ...args, limit, skip } as Pagination & T
}

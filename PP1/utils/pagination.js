export function fetchCurrentPage(obj, page, limit, sortFunction, args){
  const start = (page - 1) * limit;
  const end = start + limit;
  if (!sortFunction) {
    return {curPage: obj.slice(start, end), hasMore: end < obj.length};
  }
  const sorted = sortFunction(obj, ...args);
  return {curPage: sorted.slice(start, end), hasMore: end < sorted.length};
}







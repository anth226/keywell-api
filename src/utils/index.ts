export * from './pagination'
export * from './date'

export function escapeRegex(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

export function compareIds (id1: any, id2: any): boolean {
  if (!id1 || !id2) return false;
  return id1.toString() === id2.toString();
}
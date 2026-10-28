/** Removes Mongo metadata before sending a document back to the API. */
export function stripMeta<T extends object>(doc: T): Omit<T, '_id'> {
  const { _id, createdAt, updatedAt, deletedAt, __v, ...rest } = doc as T & Record<string, unknown>;
  void _id;
  void createdAt;
  void updatedAt;
  void deletedAt;
  void __v;
  return rest as Omit<T, '_id'>;
}

import { Router } from 'express';
import type { Model } from 'mongoose';
import type { ZodTypeAny } from 'zod';
import { asyncHandler, notFound } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import { logActivity } from '../../lib/activity.js';
import { reorderSchema } from '../../schemas/index.js';
import { uniqueSlug } from '../../lib/slug.js';

interface CrudOptions {
  model: Model<any>;
  schema: ZodTypeAny;
  entity: string;
  label: (doc: any) => string;
  sort?: Record<string, 1 | -1>;
  /** Auto-generate `slug` from this localized field when empty. */
  slugFrom?: string;
  /** Hook to clean data (e.g. sanitize rich text) before saving. */
  prepare?: (data: any) => any;
}

/** Standard list / get / create / update / soft-delete / reorder routes. */
export function crudRouter(opts: CrudOptions) {
  const { model, schema, entity, label, sort = { order: 1, createdAt: -1 }, slugFrom, prepare = (d) => d } = opts;
  const router = Router();

  const withSlug = async (data: any, id?: string) => {
    if (!slugFrom) return data;
    const base = data.slug || data[slugFrom]?.en || '';
    return { ...data, slug: await uniqueSlug(model, base, id) };
  };

  router.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json(await model.find({ deletedAt: null }).sort(sort).lean());
    }),
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findOne({ _id: req.params.id, deletedAt: null }).lean();
      if (!doc) throw notFound(entity);
      res.json(doc);
    }),
  );

  router.post(
    '/',
    validate(schema),
    asyncHandler(async (req, res) => {
      const doc = await model.create(await withSlug(prepare(req.body)));
      await logActivity(req, 'created', entity, doc._id, label(doc));
      res.status(201).json(doc);
    }),
  );

  router.post(
    '/reorder',
    validate(reorderSchema),
    asyncHandler(async (req, res) => {
      await model.bulkWrite(
        (req.body.ids as string[]).map((id, i) => ({
          updateOne: { filter: { _id: id }, update: { $set: { order: i } } },
        })),
      );
      res.json({ ok: true });
    }),
  );

  router.put(
    '/:id',
    validate(schema),
    asyncHandler(async (req, res) => {
      const id = String(req.params.id);
      const doc = await model.findOneAndUpdate(
        { _id: id, deletedAt: null },
        await withSlug(prepare(req.body), id),
        { new: true, runValidators: true },
      );
      if (!doc) throw notFound(entity);
      await logActivity(req, 'updated', entity, doc._id, label(doc));
      res.json(doc);
    }),
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findOneAndUpdate(
        { _id: req.params.id, deletedAt: null },
        { deletedAt: new Date() },
        { new: true },
      );
      if (!doc) throw notFound(entity);
      await logActivity(req, 'deleted', entity, doc._id, label(doc));
      res.json({ ok: true });
    }),
  );

  return router;
}

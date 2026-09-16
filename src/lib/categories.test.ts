/**
 * Unit tests for category data-access helpers.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { categories } from '../../db/schema';
import { createTestDatabase } from '../../db/test-helpers';
import type { Database } from './db';
import { getAllCategories } from './categories';

describe('category data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns categories ordered by name', async () => {
        await db.insert(categories).values([
            { name: 'Strategy', description: 'strategy' },
            { name: 'Action', description: 'action' },
        ]);

        const result = await getAllCategories(db);

        expect(result).toEqual([
            { id: expect.any(Number), name: 'Action' },
            { id: expect.any(Number), name: 'Strategy' },
        ]);
    });

    it('returns an empty list when no categories exist', async () => {
        expect(await getAllCategories(db)).toEqual([]);
    });
});

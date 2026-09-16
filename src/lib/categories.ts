/**
 * Data-access helpers for retrieving category records from the database.
 */
import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Returns all categories ordered alphabetically by name.
 *
 * @param db - The database connection used to query category records.
 * @returns A promise resolving to categories containing their IDs and names.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    return db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));
}

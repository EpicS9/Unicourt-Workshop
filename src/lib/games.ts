/**
 * Data-access helpers for retrieving and filtering game records.
 */
import { eq, asc } from 'drizzle-orm';
import { and, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

/** Optional filters for narrowing the game catalog. */
export interface GameFilters {
    categoryIds?: number[];
    publisherId?: number;
}

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Returns all games ordered alphabetically by title.
 *
 * @param db - The database connection used to query game records.
 * @returns A promise resolving to every game with its related category and publisher.
 */
export async function getAllGames(db: Database): Promise<Game[]> {
    return getFilteredGames(db);
}

/**
 * Returns games matching the supplied category and publisher filters.
 *
 * @param db - The database connection used to query game records.
 * @param filters - Optional category IDs and publisher ID used to narrow results.
 * @returns A promise resolving to matching games ordered by title.
 */
export async function getFilteredGames(
    db: Database,
    filters: GameFilters = {},
): Promise<Game[]> {
    const categoryIds = filters.categoryIds?.filter((id) => Number.isInteger(id));
    const publisherId = filters.publisherId;
    const query = baseGamesQuery(db);

    let rows: GameSelectionRow[];
    if (categoryIds && categoryIds.length > 0 && publisherId !== undefined) {
        rows = await query
            .where(and(inArray(games.categoryId, categoryIds), eq(games.publisherId, publisherId)))
            .orderBy(asc(games.title));
    } else if (categoryIds && categoryIds.length > 0) {
        rows = await query.where(inArray(games.categoryId, categoryIds)).orderBy(asc(games.title));
    } else if (publisherId !== undefined) {
        rows = await query.where(eq(games.publisherId, publisherId)).orderBy(asc(games.title));
    } else {
        rows = await query.orderBy(asc(games.title));
    }

    return rows.map(mapGame);
}

/**
 * Returns all game IDs ordered by their games' titles.
 *
 * @param db - The database connection used to query game records.
 * @returns A promise resolving to game IDs in title order.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Finds a single game by ID.
 *
 * @param db - The database connection used to query the game record.
 * @param id - The ID of the game to retrieve.
 * @returns A promise resolving to the matching game, or null when it does not exist.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}

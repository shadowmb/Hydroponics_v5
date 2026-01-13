import { BaseRepository } from './BaseRepository';
import { IProgramDailyLog, ProgramDailyLogModel, ILogEvent } from '../schemas/ProgramDailyLog.schema';

/**
 * Get local date string in YYYY-MM-DD format (using system timezone, not UTC)
 */
function getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export class ProgramDailyLogRepository extends BaseRepository<IProgramDailyLog> {
    constructor() {
        super(ProgramDailyLogModel);
    }

    /**
     * Find or create the log document for a specific program and date.
     */
    async getOrCreateTodayLog(programId: string): Promise<IProgramDailyLog> {
        const date = getLocalDateString(); // Uses local timezone!

        let doc = await this.model.findOne({ programId, date });

        if (!doc) {
            doc = await this.model.create({
                programId,
                date,
                isVisible: true,
                events: []
            });
        }

        return doc as unknown as IProgramDailyLog;
    }

    /**
     * Add an event to the daily log
     */
    async addEvent(programId: string, event: ILogEvent): Promise<void> {
        const date = getLocalDateString(); // Uses local timezone!

        // Upsert logic: Update if exists, Insert if not
        await this.model.updateOne(
            { programId, date },
            {
                $push: { events: event },
                $setOnInsert: { isVisible: true }
            },
            { upsert: true }
        );
    }

    /**
     * Add or update an event (for deduplication of TRIGGER_SKIP events).
     * If the last event in the log matches the criteria, update it instead of adding new.
     * @param matchCriteria - Fields to match in metadata (e.g., { triggerId, windowId })
     */
    async addOrUpdateEvent(
        programId: string,
        event: ILogEvent,
        matchCriteria: { type: string; triggerId?: string; windowId?: string }
    ): Promise<void> {
        const date = getLocalDateString(); // Uses local timezone!

        // First, try to find existing document
        const doc = await this.model.findOne({ programId, date });

        if (doc && doc.events.length > 0) {
            // Find the last event of the same type for this trigger/window
            const lastIndex = doc.events.length - 1;

            // Look for matching event (starting from end)
            for (let i = lastIndex; i >= 0; i--) {
                const existing = doc.events[i];

                // Check if it matches our criteria
                if (
                    existing.type === matchCriteria.type &&
                    (!matchCriteria.triggerId || existing.metadata?.triggerId === matchCriteria.triggerId) &&
                    (!matchCriteria.windowId || existing.metadata?.windowId === matchCriteria.windowId)
                ) {
                    // Found matching event - update it in place
                    const currentCount = existing.count || 1;
                    const newCount = currentCount + 1;

                    await this.model.updateOne(
                        { programId, date, [`events.${i}.type`]: matchCriteria.type },
                        {
                            $set: {
                                [`events.${i}.timestamp`]: event.timestamp,
                                [`events.${i}.message`]: event.message,
                                [`events.${i}.metadata`]: event.metadata,
                                [`events.${i}.count`]: newCount
                            }
                        }
                    );
                    return;
                }

                // If we hit a different type, stop looking (we want the last consecutive)
                if (existing.type !== matchCriteria.type) break;
            }
        }

        // No matching event found - add as new
        await this.addEvent(programId, event);
    }

    /**
     * Get logs for a specific program and date range or single date
     */
    async getLogs(programId: string, date?: string): Promise<IProgramDailyLog[]> {
        const query: any = { programId };
        if (date) {
            query.date = date;
        }
        // sort by date desc
        return this.model.find(query).sort({ date: -1 }).lean() as unknown as IProgramDailyLog[];
    }

    /**
     * Clear logs for a day (Visual or Permanent)
     */
    async clearLog(programId: string, date: string, type: 'visual' | 'permanent') {
        if (type === 'permanent') {
            // Delete the document
            return this.model.deleteOne({ programId, date });
        } else {
            // Visual clear - just create a new empty doc or mark hidden?
            // Requirement: "We clear log... start new time window... but if we refresh we see all"
            // Wait, the user said: "Example 20 lines... clear it... see new execution... but on refresh sec all"
            // This implies a Frontend-only filter or a "Hidden Since" timestamp.

            // Actually, for "Visual Clear" but "See on refresh", that sounds purely Frontend local state.
            // BUT, the user also said "Option for permanent removal OR only visual".
            // If it's visual persistable? "As we load page, we see it again".
            // This confirms: "Visual Clear" is transient (Frontend state).
            // "Permanent" is DB delete.

            // However, the user request says: "Visual clear... show only new execution... but on refresh see all"
            // This means backend data MUST NOT be deleted for "Visual Clear".
            // So "Visual Clear" does not need a backend method, it's a frontend state reset.
            // But "Permanent" does.

            // Wait, maybe "Visual Clear" means marking it as "Archived" but still retrievable?
            // "Ако отворим или рефрешнем страница се вижда всикия лог през деня".
            // Yes, so the Backend data should record EVERYTHING. "Visual Clear" is just "Clear the console" button on UI.

            return; // No-op for backend
        }
    }
}

export const programDailyLogRepository = new ProgramDailyLogRepository();

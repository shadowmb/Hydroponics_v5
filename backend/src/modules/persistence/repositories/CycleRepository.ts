import { BaseRepository } from './BaseRepository';
import { CycleModel, ICycle } from '../schemas/Cycle.schema';

export class CycleRepository extends BaseRepository<ICycle> {
    constructor() {
        super(CycleModel);
    }
}

export const cycleRepository = new CycleRepository();

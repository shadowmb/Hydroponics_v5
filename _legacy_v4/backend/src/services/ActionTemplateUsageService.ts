import { Program } from '../models'

export class ActionTemplateUsageService {
  static async checkUsageInPrograms(actionTemplateId: string) {
    const programsUsingAT = await Program.find({
      'cycles.actions.actionTemplateId': actionTemplateId,
      'isActive': true
    }).select('_id name').lean()

    return {
      isUsed: programsUsingAT.length > 0,
      programs: programsUsingAT.map(p => ({
        programId: p._id.toString(),
        programName: p.name
      }))
    }
  }

  static async syncUsedInPrograms(actionTemplateId: string) {
    const { ActionTemplate } = await import('../models')
    const usage = await this.checkUsageInPrograms(actionTemplateId)
    
    await ActionTemplate.findByIdAndUpdate(actionTemplateId, {
      usedInPrograms: usage.programs.map(p => ({
        programId: p.programId,
        programName: p.programName,
        dateAdded: new Date()
      }))
    })

    return usage
  }

  static async syncAllActionTemplateUsage() {
    const { ActionTemplate } = await import('../models')
    const actionTemplates = await ActionTemplate.find({ isActive: true }).select('_id')
    
    for (const template of actionTemplates) {
      await this.syncUsedInPrograms(template._id.toString())
    }
  }
}
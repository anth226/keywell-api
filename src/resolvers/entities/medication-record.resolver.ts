import {ReqContext} from '../../context';
import {ChildMedication} from '../../types/schema.types';

export default {
  medication: async(parent: { childMedication: any }, arg: null, ctx: ReqContext): Promise<ChildMedication> => {
    if (!parent.childMedication) {
      return null
    }
    const result = await ctx.childMedicationsByIdLoader.load(parent.childMedication.toString())
    return {
      id: result?.id,
      dose: result?.dose,
      sendReminder: result?.sendReminder,
      medication: result?.medication as any,
      days: result?.days,
      doseAmount: result?.doseAmount,
      scheduleTime: {
        from: result?.scheduleTime?.from,
        to: result?.scheduleTime?.to,
      }
    }
  }
}

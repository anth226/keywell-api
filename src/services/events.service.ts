import IEventRecord from '../db/interfaces/event.interface';
import {EventModel} from '../db/models';

class EventService {
  
  async find(childIds: string[], from?: string, to?: string): Promise<IEventRecord[]> {
    return EventModel.find({
      $and: [
        {
          child: {
            $in: childIds,
          },
        },
        {
          ...(from || to
            ? {
                date: {
                  ...(from ? {$gte: from} : {}),
                  ...(to ? {$lte: to} : {}),
                },
              }
            : {}),
        },
      ],
    }).sort({date: 1})
  }

  async hasEventsAfter(childIds: string[], to?: string): Promise<boolean | null> {
    if (!to) {
      return null
    }
    const hasAfter = await EventModel.find({
      $and: [
        {
          child: {
            $in: childIds
          }
        },
        {
          date: {
            $gt: to
          }
        }
      ]
    }).limit(1)
    return hasAfter.length > 0
  }

  async hasEventsBefore(childIds: string[], from?: string): Promise<boolean | null> {
    if (!from) {
      return null
    }
    const hasBefore = await EventModel.find({
      $and: [
        {
          child: {
            $in: childIds
          }
        },
        {
          date: {
            $lt: from
          }
        }
      ]
    }).limit(1)
    return hasBefore.length > 0
  }

}

export const eventService = new EventService()

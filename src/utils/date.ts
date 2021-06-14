import { TimeOfDay } from '../types/schema.types';

export function getTimeOfDay(): TimeOfDay {
    const myDate = new Date();
    const hrs = myDate.getHours();
    if (hrs >= 5 && hrs < 12)
      return TimeOfDay.Morning
    else if (hrs >= 12 && hrs < 17)
      return TimeOfDay.Afternoon
    else 
      return TimeOfDay.Evening
}

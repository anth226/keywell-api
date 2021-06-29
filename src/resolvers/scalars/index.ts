import {dateTimeScalar} from './dateTime.resolver';
import {dateScalar} from './date.resolver';
import {timeScalar} from './time.resolver';

export default {
  date: dateScalar,
  dateTime: dateTimeScalar,
  time: timeScalar,
}

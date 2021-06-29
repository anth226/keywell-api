import dayjs from 'dayjs'
import _ from 'lodash'
import {TimeOfDay} from '../types/schema.types';

let currentDate: Date = null; // for testing only

/**
 * Testing only, sets the current date and time.
 * @param date
 */
export function setCurrentDate(date?: Date) {
  currentDate = date
}

export function getTimeOfDay(): TimeOfDay {
  const myDate = currentDate ?? new Date();
  const hrs = myDate.getHours();
  if (hrs >= 5 && hrs < 12)
    return TimeOfDay.Morning
  else if (hrs >= 12 && hrs < 17)
    return TimeOfDay.Afternoon
  else
    return TimeOfDay.Evening
}

export function getCurrentDateFormatted(): string {
  return dayjs(currentDate ?? new Date())
    .format('YYYY-MM-DD')
}

interface TimeCompareArgs {
  from: string
  to: string
}

interface TimeCompareResult {
  from: boolean
  to: boolean
}

export const TimeRegexp = new RegExp(/^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)

/**
 * @param args @TimeCompareArgs {from: string, to: string}
 * @returns { from: boolean, to: boolean }
 */
export function compareTime(args: TimeCompareArgs): TimeCompareResult {
  const dateFormat = 'YYYY-MM-DD'
  const {from, to} = args

  // return false if either is nil
  if (_.isNil(from) || _.isNil(to)) {
    return {from: false, to: false}
  }
  // https://stackoverflow.com/questions/7536755/regular-expression-for-matching-hhmm-time-format/7536768
  switch (true) {
    case !TimeRegexp.test(from) && !TimeRegexp.test: {
      return {from: false, to: false}
    }
    case !TimeRegexp.test(from): {
      return {from: false, to: true}
    }
    case !TimeRegexp.test(to): {
      return {from: true, to: false}
    }
  }

  // parse to today - HH:mm, ex: 2021-06-18 12:00
  const timeParsed = (input: string) => dayjs(
    `${dayjs().format(dateFormat)} ${input}`,
    `${dateFormat} HH:mm`,
  )
  const _from = timeParsed(from)
  const _to = timeParsed(to)
  // check each
  if (!_from.isValid()) {
    return {from: false, to: true}
  }
  if (!_to.isValid()) {
    return {from: true, to: false}
  }

  if (from > to) {
    return {from: false, to: true}
  }

  return {from: true, to: true}
}

import _ from 'lodash'
import {ObjectId} from 'mongoose'
import {MedicationModel} from '../db/models'
import {escapeRegex, PAGINATION_DEFAULT_LIMIT} from '../utils'
import {IUser} from '../db/interfaces/user.interface';

interface IMedicationSearchParams {
  user?: string | ObjectId | IUser
  sort?: Record<string, any>
  limit?: number
  skip?: number
  name?: string
  extendFindObj?: Record<string, any>
}

/**
 * @class MedicationService include some business rules
 * such as medication can be found by both public & authenticated by logged user
 */
class MedicationService {
  /**
   *
   * @param arg user: user search all medication without user (public) & created by authenticated user
   * @param arg sort: sort by { name: 1 } ascending by default
   * @param arg limit: limit by PAGINATION_DEFAULT_LIMIT by default
   * @param arg skip: skip = 0 by default
   * @returns
   */
  find(arg: IMedicationSearchParams) {
    const {
      user,
      name,
      // by default sort by name ascending
      sort = {
        name: 1,
      },
      limit = PAGINATION_DEFAULT_LIMIT,
      skip = 0,
      extendFindObj = {}
    } = arg
    const findObj = this.buildFindObj(user, name, extendFindObj)

    return MedicationModel.find(findObj).limit(limit).skip(skip).sort(sort)
  }

  /**
   *
   * @param user search all medication without user (public) & created by authenticated user
   * @param name search by name, case sensitive included
   * @returns
   */
  private buildFindObj(user?: string | ObjectId | IUser, name?: string, extendFindObj?: any): Record<string, any> {
    if (name?.length > 0) {
      return {
        $and: [
          {
            name: {
              $regex: new RegExp(escapeRegex(name), 'gi'),
            },
          },
          {
            $or: [
              {
                ...(_.isNil(user) ? {} : {user})
              },
              {
                user: {
                  $exists: false,
                },
              },
            ],
          },
          ...extendFindObj
        ],
      }
    }

    return {
      $and: [
        {
          $or: [
            {
              ...(_.isNil(user) ? {} : {user: user})
            },
            {
              user: {
                $exists: false
              }
            },
          ]
        },
        {
          ...extendFindObj,
        }
      ]
    }
  }
}

export const medicationService = new MedicationService()

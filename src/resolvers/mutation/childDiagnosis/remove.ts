import _ from 'lodash'
import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../context';
import { Children } from '../../../db/models';
import { ChildDiagnosisMutationsAddArgs, RemoveChildDiagnosisPayload } from '../../../types/schema.types'
import { diagnosesService } from '../../../services'

export default async function (parent: null, args: ChildDiagnosisMutationsAddArgs, ctx: ResolversContext): Promise<RemoveChildDiagnosisPayload> {
    const { childId, diagnosisId } = args
    if (!childId.trim()) {
        throw new UserInputError('Child must not be empty');
    }
    if (!diagnosisId.trim()) {
        throw new UserInputError('Diagnosis must not be empty');
    }

    // check if child exist and belong to authenticated user
    const child = await Children.findOne({
      _id: childId,
      user_id: ctx.me?.id
    })
    if (_.isNil(child)) {
      throw new UserInputError('Child is not exist');
    }
    // check if diagnoses exist
    const diagnosis = await diagnosesService.find({
      extendFindObj: {
        id: diagnosisId
      }
    })
    if (_.isNil(diagnosis) || diagnosis.length === 0) {
      throw new UserInputError('Diagnosis is not exist');
    }

    await Children.updateOne({
      _id: childId
    }, {
      $pull: {
        'diagnoses_id': diagnosisId
      }
    })

    return {
      id: diagnosis[0].id,
      removed: true
    }
}
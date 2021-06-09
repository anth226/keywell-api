import _ from 'lodash'
import {ApolloError, UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../context';
import { Children } from '../../../db/models';
import { ChildDiagnosisMutationsAddArgs, AddChildDiagnosisPayload } from '../../../types/schema.types'
import { diagnosesService } from '../../../services'

export default async function (parent: null, args: ChildDiagnosisMutationsAddArgs, ctx: ResolversContext): Promise<AddChildDiagnosisPayload> {
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

    if (child.diagnoses_id.includes(diagnosisId)) {
      throw new ApolloError('Child was diagnosed same symptom', 'CONFLICT');
    }

    // assign diagnosis to child
    const updated = await child.update({
      $push: {
        'diagnoses_id': diagnosisId
      }
    })

    return {
      id: diagnosis[0].id,
      added: updated.ok > 0
    }
}
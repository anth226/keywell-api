import _ from 'lodash'
import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {ChildModel} from '../../../../db/models';
import {ChildDiagnosisMutationsRemoveArgs, RemoveChildDiagnosisPayload} from '../../../../types/schema.types'
import {diagnosesService} from '../../../../services'

export default async function (parent: null, args: ChildDiagnosisMutationsRemoveArgs, ctx: ResolversContext): Promise<RemoveChildDiagnosisPayload> {
  const {childId, diagnosisId} = args
  if (!childId.trim()) {
    throw new UserInputError('Child must not be empty');
  }
  if (!diagnosisId.trim()) {
    throw new UserInputError('Diagnosis must not be empty');
  }

  // check if child exist and belong to authenticated user
  const child = await ChildModel.findOne({
    _id: childId,
    user: ctx.me?.id
  })
  if (_.isNil(child)) {
    throw new UserInputError('Child is not exist');
  }
  // check if diagnosesResolver exist
  const diagnosis = await diagnosesService.find({
    extendFindObj: {
      _id: diagnosisId
    }
  })
  if (_.isNil(diagnosis) || diagnosis.length === 0 || !child.diagnoses.some(id => id.toString() === diagnosisId)) {
    throw new UserInputError('Diagnosis is not exist in child');
  }

  await ChildModel.updateOne({
    _id: childId
  }, {
    $pull: {
      'diagnoses': diagnosisId
    }
  })

  return {
    id: diagnosis[0].id,
    removed: true
  }
}

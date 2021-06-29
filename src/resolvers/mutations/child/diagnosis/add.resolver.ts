import _ from 'lodash'
import {ApolloError, UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../../context';
import {ChildModel} from '../../../../db/models';
import {AddChildDiagnosisPayload, ChildDiagnosisMutationsAddArgs} from '../../../../types/schema.types'
import {diagnosesService} from '../../../../services'

export default async function (parent: null, args: ChildDiagnosisMutationsAddArgs, ctx: ResolversContext): Promise<AddChildDiagnosisPayload> {
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
  if (_.isNil(diagnosis) || diagnosis.length === 0) {
    throw new UserInputError('Diagnosis is not exist');
  }

  if ((child.diagnoses as string[]).includes(diagnosisId)) {
    throw new ApolloError('Duplicate diagnosis', 'CONFLICT');
  }

  // assign diagnosis to child
  const updated = await ChildModel.updateOne({
    _id: childId,
  }, {
    $push: {
      'diagnoses': diagnosisId
    }
  })

  return {
    id: diagnosis[0].id,
    added: updated.ok > 0
  }
}

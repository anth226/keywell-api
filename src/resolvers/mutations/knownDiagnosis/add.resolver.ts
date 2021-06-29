import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../context';
import {DiagnosisModel} from '../../../db/models';
import {Diagnosis, DiagnosisMutationPayload, KnownDiagnosesMutationsAddArgs} from '../../../types/schema.types'

export default async function (parent: null, args: KnownDiagnosesMutationsAddArgs, context: ResolversContext): Promise<DiagnosisMutationPayload> {
  const {name} = args
  if (!name.trim()) {
    throw new UserInputError('Name must not be empty');
  }

  const diagnosis = await DiagnosisModel.create({
    name,
    user: context.me?.id
  });

  return {
    id: diagnosis.id,
    diagnosis: {
      id: diagnosis.id,
      name: diagnosis.name
    } as Diagnosis
  } as DiagnosisMutationPayload
}

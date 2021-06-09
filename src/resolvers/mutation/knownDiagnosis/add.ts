
import {UserInputError} from 'apollo-server';
import type {ResolversContext} from '../../../context';
import { Diagnoses } from '../../../db/models';
import { KnownDiagnosesMutationsAddArgs, DiagnosisMutationPayload } from '../../../types/schema.types'

export default async function (parent: null, args: KnownDiagnosesMutationsAddArgs, context: ResolversContext): Promise<DiagnosisMutationPayload> {
    const { name } = args
    if (!name.trim()) {
        throw new UserInputError('Name must not be empty');
    }

    const diagnosis = await Diagnoses.create({
        name,
        // user who created this child
        user_id: context.me?.id
    });
    const result: DiagnosisMutationPayload = {
      id: diagnosis.id,
      diagnosis
    }
    return result
}
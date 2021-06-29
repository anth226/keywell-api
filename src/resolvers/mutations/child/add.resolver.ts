
import {UserInputError} from 'apollo-server';
import {encrypt} from '../../../tools/encryption';
import type {ResolversContext} from '../../../context';
import { ChildModel } from '../../../db/models';

interface AddChildMutationArgs {
  input: AddChildMutationInput
}
interface AddChildMutationInput {
    name: string,
    age: number
}
interface ChildProfile {
  id: string
  name: string
  age?: number
}
interface ChildProfilePayload {
  id: string
  child: ChildProfile
}

export default async function (parent: null, args: AddChildMutationArgs, context: ResolversContext): Promise<ChildProfilePayload> {
    const { input } = args
    const name = input.name.trim()
    if (!name) {
        throw new UserInputError('Name must not be empty');
    }

    const { age } = input
    if (age < 1 || age > 100) {
        throw new UserInputError('Age cannot be less than 1 or greater than 100');
    }

    const nameEncrypted = await encrypt(name);

    const child = await ChildModel.create({
        name: nameEncrypted,
        age,
        // user who created this child
        user: context.me?.id
    });
    console.log(`Child ${name} created`);
    const result: ChildProfilePayload = {
      id: child.id,
      child: {
        id: child.id,
        name,
        age,
      }
    }
    return result
}

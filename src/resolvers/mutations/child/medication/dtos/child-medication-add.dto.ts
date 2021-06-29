/**
 * Class validator for automatically validate from args of queries/mutations
 * Working in progress
 */
import {UserInputError} from 'apollo-server';
import {IsDate, IsDefined, IsEnum, IsObject, IsOptional, IsString, Length, validateSync} from 'class-validator';
import {uniq} from 'lodash';
import {
  ChildMedicationInput,
  ChildMedicationMutationsAddArgs,
  DayOfWeek,
  MedicationInput
} from '../../../../../types/schema.types'

class Base {

  validate() {
    const errors = validateSync(this, {validationError: {target: false}});
    if (errors.length > 0) {
      const msg = [];
      for (const err of errors) {
        for (const [key] of Object.entries(err.constraints)) {
          msg.push(err.constraints[key]);
        }
      }

      throw new UserInputError(msg.join(', '));
    }
  }
}

export class ChildMedicationAddDto extends Base implements ChildMedicationMutationsAddArgs {
  @IsDefined({message: 'Cannot input empty child'})
  @IsString()
  @Length(24)
  childId: string;

  @IsObject()
  medication: ChildMedicationInputDto

  constructor(partial: Partial<ChildMedicationMutationsAddArgs>) {
    super()
    Object.assign(this, partial);
    this.medication = new ChildMedicationInputDto(this.medication)
    this.validate()
  }

}


export class ChildMedicationInputDto extends Base implements ChildMedicationInput {

  @IsObject()
  medication: MedicationInputDto

  @IsEnum(DayOfWeek, {each: true})
  days: DayOfWeek[]

  @IsDate()
  takenFrom: Date

  @IsDate()
  takenTo: Date

  constructor(partial: Partial<ChildMedicationInputDto>) {
    super()
    Object.assign(this, partial);
    this.days = uniq(this.days)
    this.medication = new MedicationInputDto(this.medication)
  }
}

export class MedicationInputDto extends Base implements MedicationInput {
  @IsOptional()
  @IsString()
  @Length(24)
  id: string

  @IsString()
  @IsOptional()
  name: string

  constructor(partial: Partial<MedicationInputDto>) {
    super()
    Object.assign(this, partial);
    if (!this.id?.trim() && !this.name?.trim()) {
      throw new UserInputError('Please provide at least a known medication or new medication name')
    }
  }
}

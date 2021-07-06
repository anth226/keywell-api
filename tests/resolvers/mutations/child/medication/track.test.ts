import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {ChildMedicationModel, ChildModel, MedicationModel, MedicationRecordModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2} from '../../../../helper';
import {ChildMedicationMutationsTrackArgs, DayOfWeek, MedicationRecordInput, TimeOfDay} from '../../../../../src/types/schema.types';
import {encrypt} from '../../../../../src/tools/encryption';
import {initServerWithHeaders} from '../../../../createTestServer';
import {getCurrentDateFormatted, getTimeOfDay} from '../../../../../src/utils';

const apolloServerClient = createTestClient(server);

const TRACK_CHILD_MEDICATION = gql`
  mutation MedicationTrack($medication: MedicationRecordInput!) {
        child {
            medication {
                track(medication: $medication){
                    id
                    medication {
                      tracked
                      date
                      time
                      notes
                    }
            }
        }
    }
}
`;

describe('child.medication.track mutations', () => {
  let childId1: string
  let childId2: string
  let medicationId1: string
  let medicationId2: string
  let childMedicationId1: string
  let childMedicationId2: string
  const medicationName = '_medication_name_'
  const days = [DayOfWeek.Monday, DayOfWeek.Wednesday, DayOfWeek.Friday]
  const takenFrom = '10:00'
  const takenTo = '12:00'
 
  beforeAll(async function () {
      await connectDB()
      const nameEncrypted = await encrypt('_child_name_')
      const child1 = await ChildModel.create({
        name: nameEncrypted,
        age: 1,
        user: tokenPayload.id,
      })
      childId1 = child1.id
      const child2 = await ChildModel.create({
        name: nameEncrypted,
        age: 1,
        user: tokenPayloadUser2.id,
      })
      
      childId2 = child2.id

      const medication1 = await MedicationModel.create({
        name: medicationName,
        user: tokenPayload.id,
      })
      medicationId1 = medication1.id

      const medication2 = await MedicationModel.create({
        name: medicationName,
        user: tokenPayloadUser2.id,
      })
      medicationId2 = medication2.id
  
      const childMedication1 = await ChildMedicationModel.create({
        child: child1.id,
        medication: medication1.id,
        days,
        scheduleTime: {
          from: takenFrom,
          to: takenTo
        }
      })
      childMedicationId1 = childMedication1.id

      const childMedication2 = await ChildMedicationModel.create({
        child: child2.id,
        medication: medication2.id,
        days,
        scheduleTime: {
          from: takenFrom,
          to: takenTo
        }
      })
      childMedicationId2 = childMedication2.id
      
    }); 

  it('does not accept if not logged in', async () => {
    const testDate = '2021-09-12'
    const medication: MedicationRecordInput = {
      childMedicationId: childMedicationId1,
        info: {date: testDate, time: TimeOfDay.Morning}
    }
    const variables: ChildMedicationMutationsTrackArgs = {
      medication
    }
    const res = await apolloServerClient.mutate({
      mutation: TRACK_CHILD_MEDICATION,
      variables,
    })

    expect(res.errors?.length).toBe(1)
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      }),
    )
  });

  it('does not allow to track for other`s child', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const medication: MedicationRecordInput = {
      childMedicationId: childMedicationId2,
      info: {
        date: '2021-06-12'
      }
    }
    const variables: ChildMedicationMutationsTrackArgs = {
      medication
    }
    const res = await mutate({
      mutation: TRACK_CHILD_MEDICATION,
      variables
    });
    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
  });

  it('does not require info property to be defined', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const medication: MedicationRecordInput = {
      childMedicationId: childMedicationId1,
    }
    const variables: ChildMedicationMutationsTrackArgs = {
      medication
    }
    const res = await mutate({
      mutation: TRACK_CHILD_MEDICATION,
      variables
    });
    expect(res.errors).toBe(undefined);
    const medicationRecord = res.data.child.medication.track.medication
    expect(medicationRecord.time).toBe(getTimeOfDay())
    expect(medicationRecord.date).toBe(getCurrentDateFormatted())
    await MedicationRecordModel.deleteOne({_id: medicationRecord.id})
  });

  it('does not require info property but can be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const testDate = '2021-09-12'
    const testNotes = 'Fake notes'
    const medication: MedicationRecordInput = {
      childMedicationId: childMedicationId1,
      info: {
        date: testDate,
        time: TimeOfDay.Morning,
    notes: testNotes,
      }
    }
    const variables: ChildMedicationMutationsTrackArgs = {
      medication,
    }
    const res = await mutate({
      mutation: TRACK_CHILD_MEDICATION,
      variables
    });
    expect(res.errors).toBe(undefined);
    const medicationRecord = res.data.child.medication.track.medication
    expect(medicationRecord.time).toBe(TimeOfDay.Morning)
    expect(medicationRecord.date).toBe(testDate)
    expect(medicationRecord.notes).toBe(testNotes)
    await MedicationRecordModel.deleteOne({_id: medicationRecord.id})
  });

  afterAll(async function () {
    await ChildModel.deleteOne({_id: childId1})
    await ChildModel.deleteOne({_id: childId2})
    await MedicationModel.deleteOne({_id: medicationId1})
    await MedicationModel.deleteOne({_id: medicationId2})
    await ChildMedicationModel.deleteOne({_id: childMedicationId1})
    await ChildMedicationModel.deleteOne({_id: childMedicationId2})
  });
});

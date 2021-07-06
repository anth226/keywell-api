import {gql} from 'apollo-server';
import server from '../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {TagModel, UserModel} from '../../../../src/db/models';
import {connectDB} from '../../../../src/db';
import {initServerWithHeaders} from '../../../createTestServer'
import {authorizedHeaders, tokenPayload} from '../../../helper';
import {TagTypeEnum} from '../../../../src/types/schema.types';
import {DefaultTagGroup, ITag} from '../../../../src/db/interfaces';

const apolloServerClient = createTestClient(server);

const TAG_ENABLE = gql`
  mutation EnableTag($id: ID!) {
    tags {
      enable(id: $id) {
        id
        enabled
      }
    }
  }
`;

describe('enable tag mutations', () => {
  const bTagData = [
    {
      type: TagTypeEnum.Therapy,
      name: 'therapyTag',
      group: DefaultTagGroup,
      order: 1
    },
    {
      type: TagTypeEnum.Sleep,
      name: 'sleepTag',
      group: DefaultTagGroup,
      order: 2
    },
    {
      type: TagTypeEnum.Behavior,
      name: 'behaviorTag',
      group: DefaultTagGroup,
      order: 3
    },
  ] as ITag[]
  const userData = [
    {
      _id: tokenPayload.id,
      name: tokenPayload.name,
      email: tokenPayload.email,
      token: 'any',
      password: 'any',
      disabled_tags: []
    }
  ];
  let bTagCreatedArr = [], createdUserArr = []
  beforeAll(async function () {
    await connectDB()
    bTagCreatedArr = await TagModel.create(bTagData)
    userData[0].disabled_tags = [bTagCreatedArr[bTagCreatedArr.length - 1].id] // last tag behaviorTag is disabled for current user
    createdUserArr = await UserModel.create(userData)
  });

  it('does not accept if not logged in', async () => {
    const variables = {id: bTagCreatedArr[0].id}
    const res = await apolloServerClient.mutate({
      mutation: TAG_ENABLE,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'UNAUTHENTICATED'
    }));
  });

  it('does not allow empty tag id', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {id: ''}
    const res = await mutate({
      mutation: TAG_ENABLE,
      variables
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(jasmine.objectContaining({
      code: 'BAD_USER_INPUT'
    }));
    expect(res.errors?.[0].message).toBe('ID cannot be empty');
  });

  it('returns true value', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {id: bTagCreatedArr[bTagCreatedArr.length - 1].id}
    const res = await mutate({
      mutation: TAG_ENABLE,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data.tags.enable).toEqual(
      jasmine.objectContaining({
        id: bTagCreatedArr[bTagCreatedArr.length - 1].id,
        enabled: true
      })
    );

    // should check from db side
    const user = await UserModel.findById(createdUserArr[0].id)
    expect(res.errors).toBe(undefined);
    expect(user.disabled_tags.length).toBe(0);

    // revert changes
    await UserModel.updateOne({
      _id: createdUserArr[0].id
    }, {
      disabled_tags: [bTagCreatedArr[bTagCreatedArr.length - 1].id]
    })
  })

  it('returns sucess even though the provide tagid is already enabled', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders)
    const variables = {id: bTagCreatedArr[0].id}
    const res = await mutate({
      mutation: TAG_ENABLE,
      variables
    });

    expect(res.errors).toBe(undefined);
    expect(res.data.tags.enable).toEqual(
      jasmine.objectContaining({
        id: bTagCreatedArr[0].id,
        enabled: true
      })
    );
  })

  afterAll(async function () {
    const bTagIds = bTagCreatedArr.map(bt => bt.id)
    const userIds = createdUserArr.map(u => u.id)
    await TagModel.deleteMany({_id: {$in: bTagIds}})
    await UserModel.deleteMany({_id: {$in: userIds}})
  })
});

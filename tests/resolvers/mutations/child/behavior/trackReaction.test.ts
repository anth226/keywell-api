import {gql} from 'apollo-server';
import server from '../../../../../src/server';
import {createTestClient} from 'apollo-server-testing';
import {initServerWithHeaders} from '../../../../createTestServer';
import {ChildModel, TagModel, UserModel} from '../../../../../src/db/models';
import {connectDB} from '../../../../../src/db';
import {authorizedHeaders, tokenPayload, tokenPayloadUser2,} from '../../../../helper';
import {TagTypeEnum, TimeOfDay} from '../../../../../src/types/schema.types';
import {Types} from 'mongoose';
import {DefaultTagGroup, ITag} from '../../../../../src/db/interfaces/tag.interface';
import {IChild} from '../../../../../src/db/interfaces/child.interface';
import {BehaviorModel} from '../../../../../src/db/models/event.model';

const apolloServerClient = createTestClient(server);

const ADD_REACTION = gql`
    mutation AddReaction(
        $trackedBehaviorId: ID!
        $reaction: ParentReactionInput!
    ) {
        child {
            behavior {
                trackReaction(
                    trackedBehaviorId: $trackedBehaviorId
                    reaction: $reaction
                ) {
                    id
                    reaction {
                        tags {
                            name
                            group
                            type
                        }
                        feeling {
                            name
                            group
                            type
                        }
                    }
                }
            }
        }
    }
`;

describe('child:behavior:trackReaction mutations', () => {
  const mockReactionTags = [
    {
      type: TagTypeEnum.Reaction,
      name: 'Reaction1',
      order: 1,
    },
    {
      type: TagTypeEnum.Reaction,
      name: 'Reaction2',
      order: 2,
    },
    {
      type: TagTypeEnum.Reaction,
      name: 'Reaction3',
      order: 3,
    }
  ] as ITag[];
  const mockFeelingTags = [
    {
      type: TagTypeEnum.Feeling,
      name: 'happy',
      order: 1,
    },
    {
      type: TagTypeEnum.Feeling,
      name: 'sad',
      order: 2,
    },
  ] as ITag[];
  const mockChildren = [
    {
      name: 'myChild1',
      age: 21,
      user: tokenPayload.id,
    },
    {
      name: 'myChild2',
      age: 23,
      user: tokenPayloadUser2.id,
    },
  ];
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

  let createdReactionTagsAry = [],
    createdFeelingTagsAry = [],
    createdChildAry: IChild[],
    trackedBehaviorId: string,
    createdUserArr = [],
    behaviorAry = [];

  let tagsIdAry: string[], tagsNameAry: string[];

  beforeAll(async function () {
    await connectDB();

    createdReactionTagsAry = await TagModel.create(mockReactionTags);
    createdFeelingTagsAry = await TagModel.create(mockFeelingTags);
    tagsIdAry = createdReactionTagsAry.map((tag) => tag.id);
    tagsNameAry = createdReactionTagsAry.map((tag) => tag.name);
    userData[0].disabled_tags = [createdFeelingTagsAry[1].id] // last tag sad feeling tag is disabled for current user
    createdChildAry = await ChildModel.create(mockChildren);
    createdUserArr = await UserModel.create(userData)
    behaviorAry = await BehaviorModel.create([
      {
        tracked: new Date(),
        time: TimeOfDay.Morning,
        tags: tagsIdAry,
        child: createdChildAry[0].id,
        reaction: null,
      },
      {
        tracked: new Date(),
        time: TimeOfDay.Afternoon,
        tags: tagsIdAry,
        child: createdChildAry[1].id,
        reaction: null,
      },
    ]);
    trackedBehaviorId = behaviorAry[0].id;
  });

  it('does not accept if not logged in', async () => {
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: 'happy',
      },
    };
    const res = await apolloServerClient.mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'UNAUTHENTICATED',
      })
    );
  });

  it('does not accept empty trackedBehaviorId field', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: undefined,
      reaction: {
        tags: tagsNameAry,
        feeling: 'happy',
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].message).toContain(
      'Variable "$trackedBehaviorId" got invalid value undefined'
    );
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not accept non-existing behavior record', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: '60c9173fd699b20da00e4b5f',
      reaction: {
        tags: tagsNameAry,
        feeling: 'happy',
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('does not accept empty reaction field', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: undefined,
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('should be return bad_user_input if behavior tags not found.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId: behaviorAry[1].id,
      reaction: {
        tags: tagsNameAry,
        feeling: 'happy',
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('reaction:tags field should be inputted.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: undefined,
        feeling: 'happy',
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('should be return bad_user_input if behavior record is not existed.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: ['mockTag1', 'mockTag2'],
        feeling: 'happy',
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('should be return bad_user_input if reaction tags not found.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: 'Wrong Feeling',
      },
    };
    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('should be return disabled tag error if feeling tag is disabled.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: 'sad',
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT',
      })
    );
  });

  it('create new reaction successfully', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry,
        feeling: 'happy',
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    // should check from db side
    const behaviourUpdated = await BehaviorModel.findOne({
      _id: trackedBehaviorId,
    }).select('+reaction');

    let feelingTag = createdFeelingTagsAry[0];
    expect(behaviourUpdated.reaction).toEqual(
      jasmine.objectContaining({
        tags: tagsIdAry.map(id => Types.ObjectId(id)),
        feeling: Types.ObjectId(feelingTag.id)
      })
    );

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          behavior: {
            trackReaction: {
              id: trackedBehaviorId,
              reaction: {
                tags: mockReactionTags.map(t => ({
                  group: DefaultTagGroup,
                  name: t.name,
                  type: TagTypeEnum.Reaction
                })),
                feeling: {
                  name: 'happy',
                  group: DefaultTagGroup,
                  type: TagTypeEnum.Feeling
                },
              },
            },
          },
        },
      })
    );
  });

  it('create not require feeling to be specified', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: tagsNameAry
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    // should check from db side
    const behaviourUpdated = await BehaviorModel.findOne({
      _id: trackedBehaviorId,
    }).select('+reaction');

    expect(behaviourUpdated.reaction).toEqual(
      jasmine.objectContaining({
        tags: tagsIdAry.map(id => Types.ObjectId(id))
      })
    );

    expect(res.errors).toBe(undefined);
    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          behavior: {
            trackReaction: {
              id: trackedBehaviorId,
              reaction: {
                tags: mockReactionTags.map(t => ({
                  group: DefaultTagGroup,
                  name: t.name,
                  type: TagTypeEnum.Reaction
                })),
                feeling: null,
              },
            },
          },
        },
      })
    );
  });

  it('should check that at least one tag is provided.', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: []
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors?.length).toBe(1);
    expect(res.errors?.[0].extensions).toEqual(
      jasmine.objectContaining({
        code: 'BAD_USER_INPUT'
      })
    );
    expect(res.errors?.[0].message).toEqual('At least one tag is expected');
  });

  it('should accept empty tag array if feeling is provided', async () => {
    const {mutate} = initServerWithHeaders(server, authorizedHeaders);
    const variables = {
      trackedBehaviorId,
      reaction: {
        tags: [],
        feeling: 'happy'
      },
    };

    const res = await mutate({
      mutation: ADD_REACTION,
      variables,
    });

    expect(res.errors).toBeUndefined();

    const behaviourUpdated = await BehaviorModel.findOne({
      _id: trackedBehaviorId,
    }).select('+reaction');

    let feelingTag = createdFeelingTagsAry[0];
    expect(behaviourUpdated.reaction).toEqual(
      jasmine.objectContaining({
        tags: [],
        feeling: Types.ObjectId(feelingTag.id)
      })
    );

    expect(res.data).toEqual(
      jasmine.objectContaining({
        child: {
          behavior: {
            trackReaction: {
              id: trackedBehaviorId,
              reaction: {
                tags: [],
                feeling: {
                  name: feelingTag.name,
                  group: feelingTag.group,
                  type: feelingTag.type
                },
              },
            },
          },
        },
      })
    );
  });

  afterAll(async function () {
    await Promise.all([
      TagModel.deleteMany({_id: {$in: tagsIdAry}}),
      TagModel.deleteMany({_id: {$in: createdFeelingTagsAry.map((tag) => tag.id)}}),
      ChildModel.deleteMany({
        _id: {$in: createdChildAry.map((child) => child.id)},
      }),
      BehaviorModel.deleteMany({
        _id: {$in: behaviorAry.map((behavior) => behavior.id)},
      }),
      UserModel.deleteMany({_id: {$in: createdUserArr.map(u => u.id)}})
    ]);
  });
});

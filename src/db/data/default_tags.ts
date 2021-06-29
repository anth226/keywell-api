import {TagTypeEnum} from '../../types/schema.types'
import {IProtoTag} from '../interfaces/tag.interface';

const behaviorDesirable: IProtoTag[] = [
  'confidence',
  'cooperation',
  'flexibility',
  'focus',
  'helpfulness',
  'independence',
  'initiative',
  'kindness',
  'resilience',
  'self soothing',
  'sincerity',
].map((name, index) => ({
  type: TagTypeEnum.Behavior,
  group: 'Desirable',
  name,
  order: index,
}))

const behaviorUndesirable: IProtoTag[] = [
  'aggression',
  'anxiety',
  'compulsions',
  'destruction',
  'disruptive stimming',
  'distractible',
  'irritability',
  'lying',
  'meltdown',
  'panic attack',
  'oppositional',
  'non-compliance',
].map((name, index) => ({
  type: TagTypeEnum.Behavior,
  group: 'Undesirable',
  name,
  order: index,
}))

const activitiesSocial: IProtoTag[] = [
  'play date',
  'sleepover',
  'exercise',
  'party',
  'family event',
].map((name, index) => ({
  type: TagTypeEnum.Activity,
  group: 'Social',
  name,
  order: index,
}))

const activitiesLearning: IProtoTag[] = [
  'tutoring',
  'homework',
  'school',
  'sport',
  'interest classes',
].map((name, index) => ({
  type: TagTypeEnum.Activity,
  group: 'Learning',
  name,
  order: index,
}))

const activitiesRelaxation: IProtoTag[] = [
  'TV',
  'exercise',
  'free play',
  'gaming',
  'mindfulness',
  'music',
  'tablet/phone',
  'reading',
  'art',
].map((name, index) => ({
  type: TagTypeEnum.Activity,
  group: 'Relaxation',
  name,
  order: index,
}))

const activitiesDayToDay: IProtoTag[] = [
  'chores',
  'brushing teeth',
  'shopping',
  'leaving the house',
  'waking up',
  'going to sleep',
  'getting dressed',
  'haircut',
  'packing bag',
].map((name, index) => ({
  type: TagTypeEnum.Activity,
  group: 'Relaxation',
  name,
  order: index,
}))

const parentReaction: IProtoTag[] = [
  'enforced my will',
  'reacted emotionally',
  'imposed an immediate consequence',
  'bribed',
  'imposed a future consequence',
  'distracted',
  'ignored the behaviour',
  'validated the emotion',
].map((name, index) => ({
  type: TagTypeEnum.Reaction,
  name,
  order: index,
}))

const therapies: IProtoTag[] = [
  'occupational therapy',
  'physiotherapy',
  'psychology',
  'speech therapy',
].map((name, index) => ({
  type: TagTypeEnum.Therapy,
  name,
  order: index,
}))

const sleepIncidents: IProtoTag[] = [
  'interrupted sleep',
  'sleep walking',
  'nightmare',
  'insomnia',
  'night terrors',
].map((name, index) => ({
  type: TagTypeEnum.Sleep,
  name,
  order: index,
}))

const feelings: IProtoTag[] = [
  'happy',
  'focused',
  'calm',
  'positive',
  'proud',
  'bored',
  'tired',
  'sad',
  'sick',
  'frazzled',
  'silly',
  'frustrated',
  'nervous',
  'scared',
  'upset',
  'mean',
  'angry',
  'terrified',
  'aggressive',
].map((name, index) => ({
  type: TagTypeEnum.Feeling,
  name,
  order: index,
}))

export const default_tags: IProtoTag[] = [
  ...behaviorDesirable,
  ...behaviorUndesirable,
  ...activitiesSocial,
  ...activitiesLearning,
  ...activitiesRelaxation,
  ...activitiesDayToDay,
  ...parentReaction,
  ...therapies,
  ...sleepIncidents,
  ...feelings,
]

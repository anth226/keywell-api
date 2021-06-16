import mongoose from 'mongoose'

const DATABASE_URI = process.env.MONGO_CONNECTION_URI as string

export enum Models {
  User = 'users',
  Children = 'children',
  ChildrenMedication = 'child_medication',
  Medication = 'medication',
  Diagnoses = 'diagnoses',
  BehaviorTag = 'behavior_tag',
  BehaviorRecord = 'behavior_record',
  ParentReaction = 'parent_reaction',
}

export const connectDB = (uri = DATABASE_URI) => new Promise((resolve, reject) => {
  mongoose.set('useCreateIndex', true)
  mongoose.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  }).then((res) => {
    const { host, port } = res.connection
    console.log(`Connected to database ${host}:${port}`)
    resolve(true)
  }).catch(err => {
    // console.log(err)
    reject(err)
  })
})

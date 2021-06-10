import mongoose from 'mongoose';

const DATABASE_URI = process.env.MONGO_CONNECTION_URI as string;

export enum Models {
  User = 'users',
  Children = 'children',
  BehaviorTag = 'behaviorTag',
  Medication = 'medication',
  Diagnoses = 'diagnoses',
}

export const connectDB = (uri = DATABASE_URI) =>
  new Promise((resolve, reject) => {
    mongoose.set('useCreateIndex', true);
    mongoose
      .connect(uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useFindAndModify: false,
      })
      .then((res) => {
        const { host, port } = res.connection;
        console.log(`Connected to database ${host}:${port}`);
        resolve(true);
      })
      .catch((err) => {
        // console.log(err)
        reject(err);
      });
  });

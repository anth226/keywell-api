import 'dotenv/config'

import {connectDB} from './index'
import {connection} from 'mongoose'
import {default_tags} from './data/default_tags';
import {TagModel} from './models';

const forceRecreate = process.env.FORCE_RECREATE === 'true';

async function initDefaultTags() {
  if (!await TagModel.countDocuments() || forceRecreate) {
    console.log('Create default tags')
    if (forceRecreate) {
      console.log('Deleting old tags')
      await TagModel.deleteMany();
    }
    const tagsCreated = await TagModel.insertMany(default_tags);
    console.log(`${tagsCreated.length} tags created`)
  } else {
    console.log('Default tags already created')
  }
}

(async function run() {
  await connectDB()
  await initDefaultTags()
  console.log('Init successful')
  await connection.close();
})()

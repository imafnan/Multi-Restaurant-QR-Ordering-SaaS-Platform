import { MongoMemoryServer } from 'mongodb-memory-server';

const testMongo = async () => {
  try {
    console.log('Starting MongoMemoryServer...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('MongoMemoryServer started successfully! URI:', uri);
    await mongoServer.stop();
    console.log('Stopped.');
  } catch (error) {
    console.error('Failed to start MongoMemoryServer:', error);
  }
};

testMongo();

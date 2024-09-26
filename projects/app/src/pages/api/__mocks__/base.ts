import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MockParseHeaderCert } from '@/test/utils';
import { initMockData } from './db/init';

jest.mock('nanoid', () => {
  return {
    nanoid: () => {}
  };
});

jest.mock('@fastgpt/global/common/string/tools', () => {
  return {
    hashStr(str: string) {
      return str;
    }
  };
});

jest.mock('@fastgpt/service/common/system/log', jest.fn());

jest.mock('@fastgpt/service/support/permission/controller', () => {
  return {
    parseHeaderCert: MockParseHeaderCert,
    getResourcePermission: jest.requireActual('@fastgpt/service/support/permission/controller')
      .getResourcePermission,
    getResourceAllClbs: jest.requireActual('@fastgpt/service/support/permission/controller')
      .getResourceAllClbs
  };
});

const parse = jest.createMockFromModule('@fastgpt/service/support/permission/controller') as any;
parse.parseHeaderCert = MockParseHeaderCert;

jest.mock('@/service/middleware/entry', () => {
  return {
    NextAPI: (...args: any) => {
      return async function api(req: any, res: any) {
        try {
          let response = null;
          for (const handler of args) {
            response = await handler(req, res);
          }
          return {
            code: 200,
            data: response
          };
        } catch (error) {
          return {
            code: 500,
            error
          };
        }
      };
    }
  };
});

beforeAll(async () => {
  if (!global.mongod || !global.mongodb) {
    const mongod = await MongoMemoryServer.create();
    global.mongod = mongod;
    global.mongodb = mongoose;
    await global.mongodb.connect(mongod.getUri());
    await initMockData();
  }
});

afterAll(async () => {
  if (global.mongodb) {
    await global.mongodb.disconnect();
  }
  if (global.mongod) {
    await global.mongod.stop();
  }
});
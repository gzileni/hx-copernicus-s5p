import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import aws from './config.js';

const ddb = new DynamoDBClient({ region: aws.region });
export { ddb };
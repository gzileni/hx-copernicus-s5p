// Create service client module using ES6 syntax.
import { S3Client } from "@aws-sdk/client-s3";
import aws from './config.js';
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: aws.region });
export { s3Client };
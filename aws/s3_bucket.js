// Get service clients module and commands using ES6 syntax.
 import { CreateBucketCommand } from "@aws-sdk/client-s3";
 import { PutObjectCommand } from "@aws-sdk/client-s3";
 import { s3 } from "./s3_client.js";

// Create the Amazon S3 bucket.
const create = async (bucket_name) => {

    // Set the bucket parameters
    const bucketParams = { Bucket: bucket_name };

    try {
        const data = await s3.send(new CreateBucketCommand(bucketParams));
        console.log("Success", data.Location);
        return data;
    } catch (err) {
        console.log("Error", err);
    }
};

const upload = async (bucket_name, key, body) => {

    const bucketParams = {
        Bucket: bucket_name,
        // Specify the name of the new object. For example, 'index.html'.
        // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
        Key: key,
        // Content of the new object.
        Body: body,
    };

    try {
        const data = await s3Client.send(new PutObjectCommand(bucketParams));
        console.log(
        "Successfully uploaded object: " +
            bucketParams.Bucket +
            "/" +
            bucketParams.Key
        );
        return data; // For unit tests.
        
    } catch (err) {
        console.log("Error", err);
    }

}

export default {
    create,
    upload
}
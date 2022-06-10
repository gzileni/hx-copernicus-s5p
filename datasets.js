import https from 'node:https';
import stream from 'node:stream';
import bucket from './aws/s3_bucket.js';

import _ from 'lodash';

const download = async (bucket, dataset, dest, cb) => {

    _.forEach(dataset, d => {

        const writer = new stream.Writable();

        const options = {
            headers: {
                'Authorization': 'Basic czVwZ3Vlc3Q6czVwZ3Vlc3Q=',
                'Content-Type': 'application/xml'
            } 
        }

        https.get(d.url, options, res => {
            
            res.pipe(writer);

            writer.on('pipe', (src) => {
                console.log('Something is piping into the writer.');
            });

            writer._write = (chunk, encoding, next) => {
                console.log(chunk.toString())
                bucket(bucket, d.title, chunk);
                next();
            }

            writer.on('finish', () => {
                console.log('All writes are now complete.');
            });

        }).on('error', (e) => {
            console.error(e);
        });
    });

}

export default {
    download
}
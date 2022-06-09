import https from 'node:https';
// import { fs } from 'node:fs/promises';
import { open } from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import bucket from './aws/s3_bucket.js';

import _ from 'lodash';

const download = async (dataset, dest, cb) => {

    _.forEach(dataset, d => {

        bucket.create(d.title);

        const dirPath = path.join(__dirname, `/${dest}/${d.id}`);
        console.log(dirPath)
        const fd = open(dirPath);
        console.log(path);
        const stream = fd.createWriteStream;

        https.get(d.url, (res) => {
            console.log(JSON.stringify(res));
            console.log('statusCode:', res.statusCode);
            console.log('headers:', res.headers);
            bucket.create(d.title);
            bucket.upload(d.title, d.id, res.data);
        }).on('error', (e) => {
            console.error(e);
        });
    });

}

export default {
    download
}
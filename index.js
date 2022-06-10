import config from './config.js';
import products from './products.js';
import { createRequire } from "module";
import stream from 'node:stream';
const require = createRequire(import.meta.url);

import https  from 'node:https';
import { mkdir } from 'node:fs';

import _ from 'lodash';
import * as turf from '@turf/turf';
import { upload as bucket } from './aws/s3_bucket.js';

const xml2js = require('xml2js');
const parser = new xml2js.Parser({ attrkey: "ATTR" });

const DOWNLOAD_URL = './download';

const auth = {
    headers: {
        'Authorization': 'Basic czVwZ3Vlc3Q6czVwZ3Vlc3Q=',
        'Content-Type': 'application/xml'
    } 
}

/**
 * 
 * @param {*} bucket 
 * @param {*} dataset 
 * @param {*} dest 
 * @param {*} cb 
 */
const download = async (bucket_name, dataset, dest, cb) => {

    _.forEach(dataset, d => {

        const writer = new stream.Writable();

        https.get(d.url, auth, res => {
            
            res.pipe(writer);

            writer.on('pipe', (src) => {
                console.log('Something is piping into the writer.');
            });

            writer._write = (chunk, encoding, next) => {
                console.log('downloading ...')
                bucket(bucket_name, d.title, chunk);
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

/**
 * 
 * @param {*} bbox 
 * @param {*} days 
 * @param {*} page_start 
 * @param {*} product 
 * @param {*} dest 
 */
const get_datasets = (bbox, days, page_start, product, dest) => {

    const poly = turf.bboxPolygon(bbox);
    let coordinates = [];
    _.forEach(poly.geometry.coordinates, coordinate => {
        _.forEach(coordinate, c => {
            coordinates.push(c.join(' '))
        });
    })

    // footprint:"Intersects(POLYGON((-4.53 29.85, 26.75 29.85, 26.75 46.80,-4.53 46.80,-4.53 29.85)))"
    const footprint = `footprint:"Intersects(POLYGON((${coordinates.join(',')})))"`;

    const url = `https://${config.url}/dhus/search?start=${page_start}&rows=100&q=ingestiondate:[NOW-${days}DAYS TO NOW] AND platformname:${config.platform} AND producttype:${product} AND ${footprint}`;

    let req = https.get(url, auth, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/xml/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                            `Expected application/xml but received ${contentType}`);
        }

        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            res.resume();
            return;
        }

        let rawData = null;
        res.setEncoding('utf8');
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
            try {
                parser.parseString(rawData, (error, result) => {
                    if(error === null) {

                        let total_size = 0;

                        const datasets = _.map(result["feed"]["entry"], entry => {

                            const size = _.find(entry["str"], s => {
                                return s["ATTR"]["name"] === "size"
                            })["_"];

                            const size_mb = parseFloat(_.trim(_.replace(size, 'MB', '')));
                            total_size += size_mb;

                            return {
                                title: entry["title"][0],
                                url: entry["link"][0]["ATTR"]["href"],
                                id: entry["id"][0],
                                size_mb: size_mb,
                                pending: total_size >= config.chunk
                            }
                            
                        });

                        const ds_no_pending = _.filter(datasets, d => {
                            return d.pending === false;
                        });

                        const ds_pending = _.filter(datasets, d => {
                            return d.pending === true;
                        });

                        // ddb(ds_pending);
                        download('sp5', ds_pending, dest)
                        // dataset.download(ds_no_pending, dest);


                    } else {
                        console.log(error);
                    }
                });


            } catch (e) {
                console.error(e.message);
            }
        });

    })

    req.on('error', error => {
        console.error(error)
    })

    req.end();

    /*
    https.get(options, res => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];

        let error;
        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                            `Status Code: ${statusCode}`);
        } else if (!/^application\/json/.test(contentType)) {
            error = new Error('Invalid content-type.\n' +
                            `Expected application/json but received ${contentType}`);
        }

        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            res.resume();
            return;
        }

        res.setEncoding('utf8');

        let rawData = '';
        
        res.on('data', (chunk) => { rawData += chunk; });
        
        res.on('end', () => {
            try {

                parser.parseString(rawData, (error, result) => {
                    if(error === null) {
                        console.log(result);
                    }
                    else {
                        console.log(error);
                    }
                });


            } catch (e) {
                console.error(e.message);
            }
        });

    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
    });
    */
}

const create_download_folder = (path) => {
    mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
    });
}

const main = () => {

    _.forEach(config.zones, zone => {
        const dest = `${DOWNLOAD_URL}/${zone.key}`
        create_download_folder(dest);
        const bbox = zone.value;
        _.forEach(products, product => {
            const datasets = get_datasets(bbox, zone.days, 1, product.product, dest);
        })
        

    })


}

main();





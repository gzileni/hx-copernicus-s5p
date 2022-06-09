import { BatchWriteItemCommand } from "@aws-sdk/client-dynamodb";
import { ddb } from "./ddb_client.js";
import aws_config from './config.js';

import _ from 'lodash';

/**
 * 
 * @param {*} items 
 * @returns 
 */
const _create_params = async (items) => {

    let params = {
        RequestItems: {}
    }

    params.RequestItems[aws_config.table] = _.map(items, item => {
       return {
            PutRequest: {
                Item: {
                    did: {
                        S: item.id
                    },
                    title: {
                        S: item.title
                    },
                    url: {
                        S: item.url
                    },
                    size: {
                        N: item.size_mb.toString()
                    }
                }
            }
        } 
    });

    return params;
    
}

/**
 * 
 * @param {*} items 
 * @returns 
 */
const write = async (items) => {
  try {
        const params = await _create_params(items);
        const data = await ddb.send(new BatchWriteItemCommand(params));
        console.log("Success, items inserted", data);
        return data;
  } catch (err) {
        console.log("Error", err);
  }
};

export default write

  
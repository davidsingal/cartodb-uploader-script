'use strict';

import csv from 'csv';
import request from 'request';
import prompt from 'prompt';
import fs from 'fs';
import colors from 'colors';

const schema = {
  properties: {
    csvPath: {
      required: true
    },
    cartodbUser: {
      required: true
    },
    cartodbApiKey: {
      required: true
    },
    instanceUrl: {
      required: false
    },
    numberOfThreads: {
      type: 'number',
      pattern: /^\d+$/,
      default: 5,
      required: false
    }
  }
};

// First, we ask first required data
prompt.start();

prompt.get(schema, function (err, input) {
  if (err) {
    throw err;
  }

  const path = '/api/v1/synchronizations';
  const cartodbApiUrl = input.instanceUrl ?
    `${input.instanceUrl}${path}` :
    `https://${input.cartodbUser}.cartodb.com${path}`;

  // Reading CSV file
  fs.readFile(input.csvPath, 'utf8', function(err, csvFile) {
    if (err) {
      throw err;
    }

    // Parsing CSV file to object
    csv.parse(csvFile, function(err, data) {
      if (err) {
        throw err;
      }
      const csvData = data.slice(1);

      const uploadFile = function(url, timesync) {
        let params = {
          form: {
            url: url,
            interval: timesync,
            auth_token: input.cartodbApiKey
          }
        };
        request.post(cartodbApiUrl, params, function(err, httpResponse, body) {
          if (err) {
            return console.log(`Failed: ${url}`.red);
          }
          console.info(`Uploaded successfully: ${url}`.green);
        });

        console.info('Uploading...'.cyan);
      };

      // For each csv row upload file
      csvData.forEach((d) => uploadFile(d[0], d[1]));
    });
  });
});

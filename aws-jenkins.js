// Timothy Dement
// FRI FEB 23 2018

var AWS = require( 'aws-sdk' );

AWS.config.update( { region: 'us-east-1' } );

var EC2 = new AWS.EC2();

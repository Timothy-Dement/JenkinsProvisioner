// Timothy Dement
// FRI FEB 23 2018

var AWS = require( 'aws-sdk' );
var fs = require( 'fs' );

AWS.config.update( { region : 'us-east-1' } );

var EC2 = new AWS.EC2();

var privateKey;
var publicIpAddress;
var instanceId;
var allocationId;

var createKeyPairParams = { KeyName : 'CheckBoxTrusty' };

EC2.createKeyPair(createKeyPairParams, function(err, data)
{
    if(err) console.log('\nFailed to create key pair\n', err);
    else
    {
        console.log('\nSuccessfully created key pair\n');

        privateKey = data.KeyMaterial;

        var createSecurityGroupParams =
        {
            Description : 'CheckBoxTrusty',
            GroupName : 'CheckBoxTrusty'
        };

        EC2.createSecurityGroup(createSecurityGroupParams, function(err, data)
        {
            if(err) console.log('Failed to create security group\n', err);
            else
            {
                console.log('Successfully created security group\n');

                var authorizeSecurityGroupIngressParams =
                {
                    GroupName : 'CheckBoxTrusty',
                    IpPermissions :
                    [
                        {
                            IpProtocol : 'tcp',
                            FromPort : 22,
                            ToPort : 22,
                            IpRanges : [ { 'CidrIp' : '0.0.0.0/0' } ]
                        },
                        {
                            IpProtocol : 'tcp',
                            FromPort : 3002,
                            ToPort : 3002,
                            IpRanges : [ { 'CidrIp' : '0.0.0.0/0' } ]
                        },
                        {
                            IpProtocol : 'tcp',
                            FromPort : 27017,
                            ToPort : 27017,
                            IpRanges : [ { 'CidrIp' : '0.0.0.0/0' } ] 
                        },
                        {
                            IpProtocol : 'tcp',
                            FromPort : 80,
                            ToPort : 80,
                            IpRanges : [ { 'CidrIp' : '0.0.0.0/0' } ]                             
                        }
                    ]
                };

                console.log('Pausing for 5 seconds...\n');

                setTimeout(function()
                {
                    EC2.authorizeSecurityGroupIngress(authorizeSecurityGroupIngressParams, function(err, data)
                    {
                        if(err) console.log('Failed to authorize security group ingress\n', err);
                        else
                        {
                            console.log('Successfully authorized security group ingress\n');
    
                            var runInstanceParams =
                            {
                                ImageId : 'ami-071c247d',
                                InstanceType : 'm3.medium',
                                MinCount : 1,
                                MaxCount : 1,
                                KeyName: 'CheckBoxTrusty',
                                SecurityGroups : [ 'CheckBoxTrusty' ]
                            };
    
                            EC2.runInstances(runInstanceParams, function(err, data)
                            {
                                if(err) console.log('Failed to run instance\n', err);
                                else
                                {                
                                    console.log('Successfully ran instance\n');
    
                                    instanceId = data.Instances[0].InstanceId;
    
                                    console.log('Pausing for 30 seconds...\n');
    
                                    setTimeout(function()
                                    {
                                        var allocateAddressParams = {};
    
                                        EC2.allocateAddress(allocateAddressParams, function(err, data)
                                        {
                                            if(err) console.log('Failed to allocate address\n', err);
                                            else
                                            {
                                                console.log('Successfully allocated address\n');
    
                                                publicIpAddress = data.PublicIp;
                                                allocationId = data.AllocationId;
    
                                                var associateAddressParams =
                                                {
                                                    InstanceId : instanceId,
                                                    AllocationId : allocationId
                                                };
    
                                                EC2.associateAddress(associateAddressParams, function(err, data)
                                                {
                                                    if(err) console.log('Failed to associate address\n', err);
                                                    else
                                                    {
                                                        console.log('Successfully associated address\n');

                                                        fs.writeFile('/home/ubuntu/checkbox-trusty.key', privateKey, function(err)
                                                        {
                                                            if(err) console.log('Failed to write private key file\n', err);
                                                            else
                                                            {
                                                                console.log('Successfully wrote private key file\n');
    
                                                                fs.chmod('/home/ubuntu/checkbox-trusty.key', 0600, function(err)
                                                                {
                                                                    if(err) console.log('Failed to change private key file permissions\n');
                                                                    else console.log('Successfully changed private key file permissions\n');
                                                                });
                                                            }
                                                        });
    
                                                        var inventory = `[checkbox-trusty]\n`;
                                                        inventory += publicIpAddress;
                                                        inventory += ' ansible_user=ubuntu';
                                                        inventory += ' ansible_ssh_private_key_file=/home/ubuntu/checkbox-trusty.key';
                                                        inventory += " ansible_ssh_common_args='-o StrictHostKeyChecking=no'"
    
                                                        fs.writeFile('/home/ubuntu/inventory-checkbox', inventory, function(err)
                                                        {
                                                            if(err) console.log('Failed to write inventory-checkbox file\n');
                                                            else console.log('Successfully wrote inventory-checkbox file\n');
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }, 30000);
                                }
                            });
                        }
                    });
                }, 5000);
            }
        });
    }
});

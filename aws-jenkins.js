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

var createKeyPairParams = { KeyName : 'Jenkins' };

EC2.createKeyPair(createKeyPairParams, function(err, data)
{
    if(err) console.log('Failed to create key pair\n', err);
    else
    {
        console.log('Successfully created key pair\n');

        privateKey = data.KeyMaterial;

        var createSecurityGroupParams =
        {
            Description : 'Jenkins',
            GroupName : 'Jenkins'
        };

        EC2.createSecurityGroup(createSecurityGroupParams, function(err, data)
        {
            if(err) console.log('Failed to create security group\n', err);
            else
            {
                console.log('Successfully created security group\n');

                var runInstanceParams =
                {
                    ImageId : 'ami-3c383146',
                    InstanceType : 't1.micro',
                    MinCount : 1,
                    MaxCount : 1,
                    KeyName: 'Jenkins',
                    SecurityGroups : [ 'Jenkins' ]
                };

                EC2.runInstances(runInstanceParams, function(err, data)
                {
                    if(err) console.log('Failed to run instance\n', err);
                    else
                    {
                        console.log('Successfully ran instance\n');

                        instanceId = data.Instances[0].InstanceId;

                        console.log('Pausing for 1 minute...\n');

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

                                            fs.writeFile('/home/vagrant/share/keys/jenkins.key', privateKey, function(err)
                                            {
                                                if(err) console.log('Failed to write private key file\n', err);
                                                else
                                                {
                                                    console.log('Successfully wrote private key file\n');

                                                    fs.chmod('/home/vagrant/share/keys/jenkins.key', 0600, function(err)
                                                    {
                                                        if(err) console.log('Failed to change private key file permissions\n');
                                                        else console.log('Successfully changed private key file permissions\n');
                                                    });
                                                }
                                            });

                                            var inventory = `[jenkins]\n`
                                            inventory += publicIpAddress
                                            inventory += ' ansible_user=vagrant'
                                            inventory += ' ansible_ssh_private_key_file=./keys/jenkins.key'
                                            inventory += ' ansible_python_interpreter=/usr/bin/python3'

                                            fs.writeFile('/home/vagrant/share/inventory', inventory, function(err)
                                            {
                                                if(err) console.log('Failed to write inventory file\n');
                                                else console.log('Successfully wrote inventory file\n');
                                            });
                                        }
                                    });
                                }
                            });
                        }, 60000);
                    }
                });
            }
        });
    }
});

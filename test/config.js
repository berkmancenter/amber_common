var servers = {
	'drupal' : 'http://54.83.31.107',
	'wordpress' : 'http://54.83.43.20',
	'apache' : 'http://54.83.48.54',
	'nginx' : 'http://54.83.48.109'
}

var web_server_pages = {
	'apache' : ['/'],
	'nginx' : ['/']
}

/* Utility functions */

function getServer(platform) {
	return servers[platform];
}

function testHttpStatus(platform, test) {
    casper.start(getServer(platform), function() {
		test.assertHttpStatus(200);
    });
}



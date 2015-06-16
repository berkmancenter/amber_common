casper.test.begin('Apache Amber admin page exists', function suite(test) {
	testAmberAdminPage('apache', test);
	
    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx Amber admin page exists', function suite(test) {
	testAmberAdminPage('nginx', test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx admin page delete captures', function suite(test) {
	testAmberAdminPage('apache', test);
	
    casper.run(function() { test.done(); });
});




function testAmberAdminPage(platform, test) {
    casper.start(getServer(platform) + "/amber/admin", function() {
		test.assertHttpStatus(200);
		test.assertSelectorHasText('h1','Amber Dashboard');
	});
}


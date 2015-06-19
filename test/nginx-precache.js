/**
 * Tests for the Nginx pages that can be run immediately after the server comes online
 */

casper.test.begin('Nginx: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('nginx'), function() {
		test.assertHttpStatus(200);    	
		test.assertTitle('Welcome to nginx!');
	    test.assertTextExists('Thank you for using nginx', "Text at the end of the page exists");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Admin page is up', function suite(test) {
    casper.start(getServer('nginx') + "/amber/admin", function() {
		test.assertHttpStatus(200);
		test.assertSelectorHasText('h1','Amber Dashboard');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Pages with test content are up before being cached (Small Page)', function suite(test) {
	testPage1SimpleNoLinks('nginx',test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Pages with test content are up before being cached (War and Peace)', function suite(test) {
	testPage2WarAndPeace('nginx',test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Link detection works', function suite(test) {
	testAmberAdminPageCheckURLsAndClearCache('nginx', 2, test);

    casper.run(function() { test.done(); });
});




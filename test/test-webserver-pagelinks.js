/**
 * Tests for the Nginx and Apache Admin pages that can be 
 * run immediately after the server comes online
 */

/**** Sniff Tests ****/

casper.test.begin('Nginx page sniff test', function suite(test) {
	testHttpStatus('nginx', test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache page sniff test', function suite(test) {
	testHttpStatus('apache', test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress page sniff test', function suite(test) {
	// testHttpStatus('wordpress', test);
	test.skip(1, "Skipped one test");

    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal page sniff test', function suite(test) {
	testHttpStatus('drupal', test);

    casper.run(function() { test.done(); });
});


/**** Check some basic content on the page ****/

casper.test.begin('Nginx test page sniff test', function suite(test) {
    casper.start(getServer('nginx'), function() {
		test.assertTitle('Welcome to nginx!');
	    test.assertTextExists('Thank you for using nginx', "Text at the end of the page exists");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache test page sniff test', function suite(test) {
    casper.start(getServer('apache'), function() {
		test.assertTitle('Apache2 Ubuntu Default Page: It works');
	    test.assertTextExists('Please report bugs specific to modules', "Text at the end of the page exists");
	});

    casper.run(function() { test.done(); });
});

/**** Run through specific test pages ****/

casper.test.begin('Nginx Test Page 1', function suite(test) {
	testPage1SimpleNoLinks('nginx', test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache Test Page 1', function suite(test) {
	// testPage1SimpleNoLinks('apache', test);
	test.skip(1, "Skipped one test");

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx Test Page 2', function suite(test) {
	testPage2WarAndPeace('nginx', test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache Test Page 2', function suite(test) {
	// testPage2WarAndPeace('apache', test);
	test.skip(1, "Skipped one test");

    casper.run(function() { test.done(); });
});

/**** Utility functions ****/

function testPage1SimpleNoLinks(platform, test) {
    casper.start(getServer(platform) + "/data/test1.html", function() {
		test.assertHttpStatus(200);
		test.assertTitle("Test 1 - Small page with no links");
	    test.assertTextExists('Peanuts are often served', "Text at the end of the page exists");
	});
}

function testPage2WarAndPeace(platform, test) {
    casper.start(getServer(platform) + "/data/test2.html", function() {
		test.assertHttpStatus(200);
		test.assertTitle("Test 2 - War and Peace");
	    test.assertTextExists('and to recognize a dependence of which we are not conscious.', "Text near the end of the page exists");
	});
}




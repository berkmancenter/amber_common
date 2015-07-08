/**
 * Tests for the Apache pages that can be run immediately after the server comes online
 */

casper.options.pageSettings = {
    userName: 'ubuntu',
    password: getAdminPassword( 'apache' )
};

casper.test.begin('Apache: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('apache'), function() {
		test.assertHttpStatus(200);    	
		test.assertTitle('Apache2 Ubuntu Default Page: It works');
	    test.assertTextExists('Please report bugs specific to modules', "Text at the end of the page exists");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache: Admin page is up', function suite(test) {
    casper.start(getServer('apache') + "/amber/admin", function() {
		test.assertHttpStatus(200);
		test.assertSelectorHasText('h1','Amber Dashboard');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache: Pages with test content are up before being cached (Small Page)', function suite(test) {
	testPage1SimpleNoLinks('apache',test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache: Pages with test content are up before being cached (War and Peace)', function suite(test) {
	testPage2WarAndPeace('apache',test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache: Link detection works', function suite(test) {
	testAmberAdminPageCheckURLsAndClearCache('apache', 9, test);

    casper.run(function() { test.done(); });
});


// the following must be performed after the ClearCache test above

casper.test.begin('apache: W03_normal', function suite(test) {
  testW03_normal('apache', test, true);

  casper.run(function() { test.done(); });
});

casper.test.begin('apache: W03_robots', function suite(test) {
  testW03_robots('apache', test, true);

  casper.run(function() { test.done(); });
});

casper.test.begin('apache: W06_exclude_regex', function suite(test) {
  testW06_exclude_regex('apache', test, true);

  casper.run(function() { test.done(); });
});

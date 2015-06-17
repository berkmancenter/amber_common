/**
 * Tests for the Nginx and Apache Admin pages
 */

/**** Confirm the admin page exists ****/

casper.test.begin('Apache Amber admin page exists', function suite(test) {
	testAmberAdminPage('apache', test);
	
    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx Amber admin page exists', function suite(test) {
	testAmberAdminPage('nginx', test);

    casper.run(function() { test.done(); });
});

/**** Make sure link detection and deletion work ****/

casper.test.begin('Nginx clear cache, identify URLs on home page, then confirm they are queued to cache', function suite(test) {
	testAmberAdminPageCheckURLsAndClearCache('nginx', 2, test);

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache clear cache, identify URLs on home page, then confirm they are queued to cache', function suite(test) {
	testAmberAdminPageCheckURLsAndClearCache('apache', 9, test);

    casper.run(function() { test.done(); });
});


/**** Utility functions ****/

function testAmberAdminPage(platform, test) {
    casper.start(getServer(platform) + "/amber/admin", function() {
		test.assertHttpStatus(200);
		test.assertSelectorHasText('h1','Amber Dashboard');
	});
}

function testAmberAdminPageCheckURLsAndClearCache(platform, linkCountOnHomePage, test) {
    casper.start(getServer(platform) + "/amber/admin", function() {
		test.assertSelectorHasText('h1','Amber Dashboard');
	});

    casper.then(function() {
    	this.click("a.delete-all");
    });

    casper.then(function() {
		test.assertSelectorHasText('tr.to-capture td:last-child','0');
    });

    casper.thenOpen(getServer(platform)).then(function() {		
    });

    casper.thenOpen(getServer(platform) + "/amber/admin", function() {
		test.assertSelectorHasText('h1','Amber Dashboard');
		test.assertSelectorHasText('tr.to-capture td:last-child', linkCountOnHomePage);
	});
}


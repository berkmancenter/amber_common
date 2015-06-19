/**
 * Tests for Nginx that can be run once the server has been up for at least 10 minutes
 *
 * Preconditions: 
 * - site has been up for at least 10 minutes (assume 5 minute cron interval)
 * - pages to be tested have been warmed up
 */

casper.test.begin('Nginx: Scheduled cache functionality works', function suite(test) {
    casper.start(getServer('nginx'), function() {
    	
		/* nginx.org should be cached */
		test.assertExists('a[href="http://nginx.org/"]');
		test.assertExists('a[href="http://nginx.org/"][data-amber-behavior]');
		test.assertExists('a[href="http://nginx.org/"][data-versionurl]');
		test.assertExists('a[href="http://nginx.org/"][data-versiondate]');

		/* nginx.com should not be cached */
		test.assertExists('a[href="http://nginx.com/"]:not([data-versionurl])');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: View cache (using popup)', function suite(test) {

	casper.start(getServer('nginx'));

	/* Default nginx configuration uses popups for cached pages */
	casper.thenClick('a[href="http://nginx.org/"][data-versionurl]');
	casper.thenClick('a.amber-focus');

	/* Check that the cached page has been loaded */
	casper.then(function() {
		test.assertMatch(this.currentResponse.headers.get('Memento-Datetime'), /[A-Za-z]{3}, [0-9].*/,'Memento-Datetime header found');
		test.assertTitle('nginx news');
	    test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Delete cache', function suite(test) {
    casper.start(getServer('nginx') + "/amber/admin", function() {
		test.assertHttpStatus(200);
		test.assertSelectorHasText('h1','Amber Dashboard');
	});

    var startCacheCount;
    casper.then(function() {
        startCacheCount = parseInt(this.fetchText("tr.preserved td:last-child"));
    })

    casper.thenClick("table a.delete");
    casper.wait(5000, function() {this.echo("Waited 5 seconds after deleting row");});

    casper.then(function() {
        var endCacheCount = parseInt(this.fetchText("tr.preserved td:last-child"));
        test.assertEquals(startCacheCount, endCacheCount + 1, "One cache item deleted");
    })

    casper.run(function() { test.done(); });
});

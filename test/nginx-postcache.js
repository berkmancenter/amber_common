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

casper.test.begin('Nginx: Cache view count incremented', function suite(test) {
    casper.start(getServer('nginx') + "/amber/admin", function() { });

    var startViewCount;
    casper.then(function() {
        startViewCount = this.fetchText("tr.cached td:nth-child(8)");
        if (!startViewCount) {
        	startViewCount = 0;
        } else {
        	startViewCount = parseInt(startViewCount);
        }
    });

    casper.thenClick("table tr.cached a.view");
	casper.thenOpen(getServer('nginx') + "/amber/admin");

    casper.then(function() {
        var endViewCount = parseInt(this.fetchText("tr.cached td:nth-child(8)"));
        test.assertEquals(startViewCount + 1, endViewCount, "Cache view count incremented");
    });

    casper.run(function() { test.done(); });
});

// the following must be performed before the Delete cache test at the end

casper.test.begin('Nginx: W03_normal', function suite(test) {
  testW03_normal('nginx', test, false);

  casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: W03_robots', function suite(test) {
  testW03_robots('nginx', test, false);

  casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: W06_exclude_regex', function suite(test) {
  testW06_exclude_regex('nginx', test, false);

  casper.run(function() { test.done(); });
});

casper.test.begin('Nginx: Delete cache', function suite(test) {
    casper.start(getServer('nginx') + "/amber/admin", function() { });

    var startCacheCount;
    casper.then(function() {
        startCacheCount = parseInt(this.fetchText("tr.preserved td:last-child"));
    })

    casper.thenClick("table tr.cached:first-child a.delete");
    casper.wait(5000, function() {this.echo("Waited 5 seconds after deleting row");});

    casper.then(function() {
        var endCacheCount = parseInt(this.fetchText("tr.preserved td:last-child"));
        test.assertEquals(startCacheCount, endCacheCount + 1, "One cache item deleted");
    })

    casper.run(function() { test.done(); });
});

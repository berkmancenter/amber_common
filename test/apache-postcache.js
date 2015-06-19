/**
 * Tests for Apache that can be run once the server has been up for at least 10 minutes
 *
 * Preconditions: 
 * - site has been up for at least 10 minutes (assume 5 minute cron interval)
 * - pages to be tested have been warmed up
 */

casper.test.begin('Apache: Scheduled cache functionality works', function suite(test) {
    casper.start(getServer('apache'), function() {

		/* httpd.apache.org should be cached */
		test.assertExists('a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"]');
		test.assertExists('a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"][data-amber-behavior]');
		test.assertExists('a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"][data-versionurl]');
		test.assertExists('a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"][data-versiondate]');

		/* manpages.debian.org should not be cached */
		test.assertExists('a[href="http://manpages.debian.org/cgi-bin/man.cgi?query=a2enmod"]:not([data-versionurl])');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache: View cache (using hover)', function suite(test) {

	casper.start(getServer('apache'), function() {
		test.assertExists('a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"]');
		casper.mouseEvent('mouseover', 'a[href="http://httpd.apache.org/docs/2.4/mod/mod_userdir.html"]');
	});

	/* Default apache configuration uses hovers for cached pages */
	casper.waitUntilVisible('.amber-hover', function(){
		test.assertExists('.amber-hover .amber-links a:first-child');
	});

	casper.thenClick('.amber-hover .amber-links a:first-child');

	/* Check that the cached page has been loaded */
	casper.then(function() {
		test.assertMatch(this.currentResponse.headers.get('Memento-Datetime'), /[A-Za-z]{3}, [0-9].*/,'Memento-Datetime header found');
		test.assertTitle('mod_userdir - Apache HTTP Server Version 2.4');
	    test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
	});

    casper.run(function() { test.done(); });
});








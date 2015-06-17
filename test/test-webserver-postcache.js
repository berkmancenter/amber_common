/**
 * Tests for the Nginx and Apache Admin pages that can be 
 * run once the server has been up for at least 10 minutes
 *
 * Preconditions: 
 * - site has been up for at least 10 minutes (assume 5 minute cron interval)
 * - pages to be tested have been warmed up
 */


/* Webservers - Delayed tests

Test
- Check for amber annotations on specific links on all pages
- Check that popup appears on hover event
- Check for cache existence for links

*/

/**** Check that specfic links are annotated as being cached  ****/

casper.test.begin('Nginx home page link annotated with cache metadata', function suite(test) {
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

casper.test.begin('Apache home page link annotated with cache metadata', function suite(test) {
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

/**** Fetch cached pages  ****/

casper.test.begin('Nginx home page view cached page', function suite(test) {

	casper.start(getServer('nginx'));

	/* Default nginx configuration uses popups for cached pages */
	casper.thenClick('a[href="http://nginx.org/"][data-versionurl]');
	casper.thenClick('a.amber-focus');

	/* Check that the cached page has been loaded */
	casper.then(function() {
		test.assertTitle('nginx news');
	    test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Apache home page view cached page', function suite(test) {

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
		test.assertTitle('mod_userdir - Apache HTTP Server Version 2.4');
	    test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
	});

    casper.run(function() { test.done(); });
});








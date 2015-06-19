/**
 * Tests for the Drupal site that can be run immediately after the server comes online
 */

casper.test.begin('Drupal: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('drupal'), function() {
    	/* Don't check the title, since that will change once content is entered.
    	   Just look for the "Powered by Drupal" text */
        test.assertHttpStatus(200);     
	    test.assertTextExists('Powered by');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Admin pages are up', function suite(test) {
    casper.start(getServer('drupal'), function() {
        this.fillSelectors('form#user-login-form', {
            'input[name="name"]':    'admin',
            'input[name="pass"]':    getAdminPassword('drupal'),
        }, true);
    });

    casper.thenOpen(getServer('drupal') + "/admin/reports/amber", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Dashboard | Site-Install");
    });

    casper.thenOpen(getServer('drupal') + "/admin/reports/amber/detail", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Dashboard | Site-Install");
    });

    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber | Site-Install");
    });

    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Pages with test content are up before being cached', function suite(test) {
    casper.start(getServer('drupal'), function() {
        if (this.exists("form#user-login-form")) {
            this.fillSelectors('form#user-login-form', {
                'input[name="name"]':    'admin',
                'input[name="pass"]':    getAdminPassword('drupal'),
            }, true);
        }
    });

    casper.thenOpen(getServer('drupal') + "/node/add/article", function() {
        this.fillSelectors('form#article-node-form', {
            'input[name="title"]':    'Test 1 - Small page with no links',
            '#edit-body-und-0-value':  '\
The peanut or groundnut (Arachis hypogaea) is a species in the family Fabaceae (commonly known as the bean, pea or legume family).\
\
The peanut was probably first domesticated and cultivated in the valleys of Paraguay.[2] It is an annual herbaceous plant growing 30 to 50 cm (1.0 to 1.6 ft) tall. The leaves are opposite, pinnate with four leaflets (two opposite pairs; no terminal leaflet); each leaflet is 1 to 7 cm (⅜ to 2¾ in) long and 1 to 3 cm (⅜ to 1 inch) across.\
\
The flowers are a typical peaflower in shape, 2 to 4 cm (0.8 to 1.6 in) (¾ to 1½ in) across, yellow with reddish veining. The specific name, hypogaea means "under the earth"; after pollination, the flower stalk elongates, causing it to bend until the ovary touches the ground. Continued stalk growth then pushes the ovary underground where the mature fruit develops into a legume pod, the peanut – a classical example of geocarpy. Pods are 3 to 7 cm (1.2 to 2.8 in) long, normally containing 1 to 4 seeds.[3]\
\
Because, in botanical terms, "nut" specifically refers to indehiscent fruit, the peanut is not technically a nut,[4] but rather a legume. Peanuts are often served in a similar manner to true nuts in many western cuisines, and are often referred to as a nut in common English.\
            '
        }, true);
    });   
    
    casper.waitForText("has been created", function() {
        test.assertTextExists('the peanut is not technically a nut');
    });

    /* Cleanup */
    casper.thenClick(("ul.tabs.primary li:nth-child(2) a"));
    casper.thenClick(("#edit-delete"));
    casper.thenClick(("#edit-submit"));

    casper.run(function() { test.done(); });

});

casper.test.begin('Drupal: Cache now functionality works', function suite(test) {
    casper.start(getServer('drupal'), function() {
        if (this.exists("form#user-login-form")) {
            this.fillSelectors('form#user-login-form', {
                'input[name="name"]':    'admin',
                'input[name="pass"]':    getAdminPassword('drupal'),
            }, true);
        }
	});

    var link = "http://www.google.com" + "?" + Math.floor(Math.random() * 100);

    casper.thenOpen(getServer('drupal') + "/node/add/article", function() {
	    this.fillSelectors('form#article-node-form', {
	        'input[name="title"]':    'Test Page for Cache Now test',
	        '#edit-body-und-0-value':  'Lorem ipsum: ' + link + ' and more ipsum'
	    }, true);
    });   
    
    casper.waitForText("has been created", function() {
        test.assertExists('a[href="' + link + '"]');
    	this.click("ul.tabs li:last-child a"); /* Click "Cache now" */
    });

    casper.waitForText("Sucessfully cached", function() {
		test.assertExists('a[href="' + link + '"]');
		// test.assertExists('a[href="' + link + '"][data-amber-behavior]');
		test.assertExists('a[href="' + link + '"][data-versionurl]');
		test.assertExists('a[href="' + link + '"][data-versiondate]');
    });

    /* Cleanup */
    casper.thenClick(("ul.tabs.primary li:nth-child(2) a"));
    casper.thenClick(("#edit-delete"));
    casper.thenClick(("#edit-submit"));

    casper.run(function() { test.done(); });
});

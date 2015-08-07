/**
 * Tests for the Drupal site that can be run immediately after the server comes online
 */

casper.test.begin('Drupal: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('drupal'), function() {
    	/* Don't check the title, since that will change once content is entered.
    	   Just look for the "Powered by Drupal" text */
        test.assertHttpStatus(200, "Site is up");     
	    test.assertTextExists('Powered by', "Site has expected content on home page");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Admin pages are up', function suite(test) {
    drupal_login();

    casper.thenOpen(getServer('drupal') + "/admin/reports/amber", function() {
        test.assertHttpStatus(200, "Amber Dashboard is up");
        test.assertTitle("Amber Dashboard | Site-Install", "Amber Dashboard summary page has correct title");
    });

    casper.thenOpen(getServer('drupal') + "/admin/reports/amber/detail", function() {
        test.assertHttpStatus(200, "Amber Dashboard detail page is up");
        test.assertTitle("Amber Dashboard | Site-Install", "Amber Dashboard detail page has correct title");
    });

    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        test.assertHttpStatus(200, "Amber configuration page is up");
        test.assertTitle("Amber | Site-Install", "Amber configuration page has correct title");
    });

    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Pages with test content are up before being cached', function suite(test) {
    drupal_login();
    drupal_use_local();

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
        test.assertTextExists('the peanut is not technically a nut', "Test page displays correct content");
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Cache now functionality works', function suite(test) {
    drupal_login();
    drupal_use_local();

    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for Cache Now test", link);

    casper.waitForText("Sucessfully cached", function() {
		test.assertExists('a[href="' + link + '"]', "Cached link exists");
		test.assertExists('a[href="' + link + '"][data-amber-behavior]', "Cached link has data-amber-behavior attribute");
		test.assertExists('a[href="' + link + '"][data-versionurl]', "Cached link has versionurl attribute");
		test.assertExists('a[href="' + link + '"][data-versiondate]', "Cached link has data-versiondate attribute");
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: View cache / Test hover for cache display', function suite(test) {
    casper.verbose = true;
    drupal_login();
    drupal_use_local();

    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for View cache test", link);

    casper.waitForText("Sucessfully cached", function() {
        casper.mouseEvent('mouseover', 'a[href="' + link + '"]');
    });

    casper.waitUntilVisible('.amber-hover', function(){
        test.assertExists('.amber-hover .amber-links a:first-child', "Hover popup displayed");
    });

    casper.thenClick('.amber-hover .amber-links a:first-child');

    /* Check that the cached page has been loaded */
    casper.then(function() {
        test.assertMatch(this.currentResponse.headers.get('Memento-Datetime'), /[A-Za-z]{3}, [0-9].*/,'Memento-Datetime header found');
        test.assertTitle('Amber', "Page framing the cached page has title Amber");
        test.assertExists('iframe', 'iframe for cached page exists');
    });
    casper.withFrame(0, function() {
        test.assertTitle("Bing", "Cached page has correct title");        
        test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
    })

    casper.then(function() {
        this.back();
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Cache view count incremented', function suite(test) {

    drupal_login();
    drupal_use_local();
    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for Cache view count increment test", link);

    casper.waitForText("Sucessfully cached", function() {
        casper.mouseEvent('mouseover', 'a[href="' + link + '"]');
    });

    var startViewCount;
    casper.thenOpen(getServer('drupal') + "/admin/reports/amber/detail", function() {
        test.assertTitle("Amber Dashboard | Site-Install", "Navigated to Amber Dashboard detail page");
        startViewCount = this.fetchText("#block-system-main table tbody tr:first-child td:nth-child(8)");
        if (!startViewCount) {
            startViewCount = 0;
        } else {
            startViewCount = parseInt(startViewCount);
        }
    });

    casper.thenClick("#block-system-main table tbody tr:first-child td:nth-child(9) a");
    casper.thenOpen(getServer('drupal') + "/admin/reports/amber/detail", function() {
        var endViewCount = parseInt(this.fetchText("#block-system-main table tbody tr:first-child td:nth-child(8)"));
        test.assertEquals(startViewCount + 1, endViewCount, "Cache view count incremented");
    });

    casper.then(function() {
        this.back();
        this.back();
        this.back();
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});


casper.test.begin('Drupal: Delete cache', function suite(test) {

    drupal_login();
    drupal_use_local();
    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for delete cache test", link);

    var startCacheCount;
    casper.thenOpen(getServer('drupal') + "/admin/reports/amber", function() {
        test.assertTitle("Amber Dashboard | Site-Install", "Navigated to Amber Dashboard summary page");
        startCacheCount = this.fetchText("#block-system-main table tbody tr:first-child td:last-child");
        if (!startCacheCount) {
            startCacheCount = 0;
        } else {
            startCacheCount = parseInt(startCacheCount);
        }
    });

    casper.thenOpen(getServer('drupal') + "/admin/reports/amber/detail");
    casper.thenClick("#block-system-main table tbody tr:first-child td:last-child a");
    casper.thenOpen(getServer('drupal') + "/admin/reports/amber", function() {
        var endCacheCount = parseInt(this.fetchText("#block-system-main table tbody tr:first-child td:last-child"));
        test.assertEquals(startCacheCount - 1, endCacheCount, "Number of items in cache decreased after delete");
    });

    casper.then(function() {
        this.back();
        this.back();
        this.back();
        this.back();
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

/* IA Testing */

casper.test.begin('Drupal: Internet Archive : Cache now functionality works', function suite(test) {
    drupal_login();
    drupal_use_ia();
    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for Cache Now test with Internet Archive", link);

    casper.waitForText("Sucessfully cached", function() {
        test.assertExists('a[href="' + link + '"]', "Cached link exists");
        test.assertExists('a[href="' + link + '"][data-amber-behavior]', "Cached link has data-amber-behavior attribute");
        test.assertExists('a[href="' + link + '"][data-versionurl]', "Cached link has versionurl attribute");
        test.assertExists('a[href="' + link + '"][data-versiondate]', "Cached link has data-versiondate attribute");
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Internet Archive : View cache / Test hover for cache display', function suite(test) {
    drupal_login();
    drupal_use_ia();

    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for View cache test with Internet Archive", link);
    casper.waitForText("Sucessfully cached", function() {
        casper.mouseEvent('mouseover', 'a[href="' + link + '"]');
    });
    casper.waitUntilVisible('.amber-hover', function(){
        test.assertExists('.amber-hover .amber-links a:first-child', "Hover popup displayed");
    });
    casper.thenClick('.amber-hover .amber-links a:first-child');
    /* Check that the cached page has been loaded */
    casper.then(function() {
        test.assertTitle('Bing', "Cached page has correct title");
    });
    casper.then(function() {
        this.back();
    });
    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

/* Perma Testing */

casper.test.begin('Drupal: Perma : Cache now functionality works', function suite(test) {
    drupal_login();
    drupal_use_perma();
    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for Cache Now test with Perma", link);

    casper.waitForText("Sucessfully cached", function() {
        test.assertExists('a[href="' + link + '"]', "Cached link exists");
        test.assertExists('a[href="' + link + '"][data-amber-behavior]', "Cached link has data-amber-behavior attribute");
        test.assertExists('a[href="' + link + '"][data-versionurl]', "Cached link has versionurl attribute");
        test.assertExists('a[href="' + link + '"][data-versiondate]', "Cached link has data-versiondate attribute");
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: Perma : View cache / Test hover for cache display', function suite(test) {
    drupal_login();
    drupal_use_perma();

    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for View cache test with Perma", link);
    casper.waitForText("Sucessfully cached", function() {
        casper.mouseEvent('mouseover', 'a[href="' + link + '"]');
    });
    casper.waitUntilVisible('.amber-hover', function(){
        test.assertExists('.amber-hover .amber-links a.amber-cache-link', "Hover popup displayed");
    });
    casper.thenClick('.amber-hover .amber-links a.amber-cache-link');
    /* Check that the cached page has been loaded */
    casper.waitForText("Live page view", function() {
        test.assertTitleMatch(/perma.*bing.*/i, "Cached page has correct title");
    });
    casper.then(function() {
        this.back();
    });
    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

/* AWS Testing */
casper.test.begin('Drupal: AWS : Cache now functionality works', function suite(test) {
    drupal_login();
    drupal_use_aws();
    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for Cache Now test with AWS", link);

    casper.waitForText("Sucessfully cached", function() {
        test.assertExists('a[href="' + link + '"]', "Cached link exists");
        test.assertExists('a[href="' + link + '"][data-amber-behavior]', "Cached link has data-amber-behavior attribute");
        test.assertExists('a[href="' + link + '"][data-versionurl]', "Cached link has versionurl attribute");
        test.assertExists('a[href="' + link + '"][data-versiondate]', "Cached link has data-versiondate attribute");
    });

    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});

casper.test.begin('Drupal: AWS : View cache / Test hover for cache display', function suite(test) {
    drupal_login();
    drupal_use_aws();

    var link = unique_link();
    drupal_create_page_with_link_and_cache("Test Page for View cache test with AWS", link);
    casper.waitForText("Sucessfully cached", function() {
        casper.mouseEvent('mouseover', 'a[href="' + link + '"]');
    });
    casper.waitUntilVisible('.amber-hover', function(){
        test.assertExists('.amber-hover .amber-links a.amber-cache-link', "Hover popup displayed");
    });
    casper.thenClick('.amber-hover .amber-links a.amber-cache-link');
    /* Check that the cached page has been loaded */
    casper.then(function() {
        test.assertMatch(this.currentResponse.headers.get('Memento-Datetime'), /[A-Za-z]{3}, [0-9].*/,'Memento-Datetime header found');
        test.assertTitle('Amber', "Page framing the cached page has title Amber");
        test.assertExists('iframe', 'iframe for cached page exists');
    });
    casper.withFrame(0, function() {
        test.assertTitle("Bing", "Cached page has correct title");        
        test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
    })
    casper.then(function() {
        this.back();
    });
    drupal_delete_current_page();
    casper.run(function() { test.done(); });
});



/****** Utility functions ******/

function unique_link() {
    return "http://www.bing.com" + "?" + Math.floor(Math.random() * 1000);
}

/* Login */
function drupal_login() {
    casper.start(getServer('drupal'), function() {
        if (this.exists("form#user-login-form")) {
            this.fillSelectors('form#user-login-form', {
                'input[name="name"]':    'admin',
                'input[name="pass"]':    getAdminPassword('drupal'),
            }, true);
        }
    });
}

/* Delete the page currently being viewed */
function drupal_delete_current_page() {
    casper.thenClick(("ul.tabs.primary li:nth-child(2) a"));
    casper.thenClick(("#edit-delete"));
    casper.thenClick(("#edit-submit"));
}

function drupal_create_page_with_link_and_cache(title, link) {
    casper.thenOpen(getServer('drupal') + "/node/add/article", function() {
        this.fillSelectors('form#article-node-form', {
            'input[name="title"]':    title,
            '#edit-body-und-0-value':  'Lorem ipsum: ' + link + ' and more ipsum'
        }, true);
    });   
    
    casper.waitForText("has been created", function() {
        this.click("ul.tabs li:last-child a"); /* Click "Cache now" */
    });
}

function drupal_use_local() {
    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        this.fillSelectors('form', {
            'select[name="amber_backend"]': "0", /* Do not use number 0! */
        }, true);
    });
}

function drupal_use_perma() {
    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        this.fillSelectors('form', {
            'select[name="amber_backend"]': "1",
            '#edit-amber-perma-apikey':  keys['perma'],
            '#edit-amber-perma-server-url':  "http://perma-stage.org",
            '#edit-amber-perma-server-api-url':  "https://api.perma-stage.org",

        }, true);
    });
}

function drupal_use_ia() {
    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        this.fillSelectors('form', {
            'select[name="amber_backend"]': "2",            
        }, true);
    });
}

function drupal_use_aws() {
    casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
        this.fillSelectors('form', {
            'select[name="amber_backend"]': "3",
            '#edit-amber-aws-access-key':  keys['aws_access'],
            '#edit-amber-aws-secret-key':  keys['aws_secret'],
            '#edit-amber-aws-bucket':  keys['aws_bucket'],
        }, true);
    });
}







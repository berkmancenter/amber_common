/**
 * Tests for the Drupal site that can be run immediately after the server comes online
 */

casper.test.begin('Wordpress: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('wordpress'), function() {
        test.assertHttpStatus(200);     
        test.assertTitle('Amber WordPress | Just another WordPress site');
        test.assertTextExists('Proudly powered by WordPress');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: Admin pages are up', function suite(test) {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Dashboard ‹ Amber Wordpress — WordPress");
    });

    casper.thenOpen(getServer('wordpress') + "/wp-admin/options-general.php?page=amber-setting-admin", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Settings ‹ Amber Wordpress — WordPress");
    });

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: Pages with test content are up before being cached', function suite(test) {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });

    casper.thenOpen(getServer('wordpress') + "/wp-admin/post-new.php?post_type=page", function() {
        casper.thenClick("button#content-html");
        this.fillSelectors('form[name="post"]', {
            'input[name="post_title"]':    'Test 1 - Small page with no links',
            'textarea[name="content"]':  '\
The peanut or groundnut (Arachis hypogaea) is a species in the family Fabaceae (commonly known as the bean, pea or legume family).\
\
The peanut was probably first domesticated and cultivated in the valleys of Paraguay.[2] It is an annual herbaceous plant growing 30 to 50 cm (1.0 to 1.6 ft) tall. The leaves are opposite, pinnate with four leaflets (two opposite pairs; no terminal leaflet); each leaflet is 1 to 7 cm (⅜ to 2¾ in) long and 1 to 3 cm (⅜ to 1 inch) across.\
\
The flowers are a typical peaflower in shape, 2 to 4 cm (0.8 to 1.6 in) (¾ to 1½ in) across, yellow with reddish veining. The specific name, hypogaea means "under the earth"; after pollination, the flower stalk elongates, causing it to bend until the ovary touches the ground. Continued stalk growth then pushes the ovary underground where the mature fruit develops into a legume pod, the peanut – a classical example of geocarpy. Pods are 3 to 7 cm (1.2 to 2.8 in) long, normally containing 1 to 4 seeds.[3]\
\
Because, in botanical terms, "nut" specifically refers to indehiscent fruit, the peanut is not technically a nut,[4] but rather a legume. Peanuts are often served in a similar manner to true nuts in many western cuisines, and are often referred to as a nut in common English.\
            '
        }, false);
        this.thenClick("#publish");
    });   
    
    casper.thenClick("span#view-post-btn a");
    casper.wait(5000, function() {this.echo("Waited for 5 seconds");})    

    casper.then(function() {
        test.assertTitle("Test 1 – Small page with no links | Amber WordPress");
        test.assertTextExists('the peanut is not technically a nut');
    });

    /* Cleanup */
    casper.thenClick("li#wp-admin-bar-edit a");
    casper.thenClick("#delete-action a");

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: "Cache now" functionality works', function suite(test) {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });

    var link = "http://www.google.com" + "?" + Math.floor(Math.random() * 100);

    casper.thenOpen(getServer('wordpress') + "/wp-admin/post-new.php?post_type=page", function() {
        casper.thenClick("button#content-html");
        this.fillSelectors('form[name="post"]', {
            'input[name="post_title"]':    'Test Page for Cache Now test',
	        'textarea[name="content"]':  'Lorem ipsum: <a href="' + link + '">Google</a> and more ipsum'
        }, false);
    });   
     
    casper.thenClick("#publish");
    casper.thenClick("input#cache_now");

    casper.waitForText("These links were cached", function() {
            this.echo("Links cached, waiting for 5 seconds");
            casper.wait(5000, function() {this.echo("Done waiting");});
    });

    casper.thenClick("span#view-post-btn a");

    casper.then(function() {
        test.assertExists('a[href="' + link + '"]');
        test.assertTitle("Test Page for Cache Now test | Amber WordPress");
        // test.assertExists('a[href="' + link + '"][data-amber-behavior]');
        test.assertExists('a[href="' + link + '"][data-versionurl]');
        test.assertExists('a[href="' + link + '"][data-versiondate]');
    });


    /* Cleanup */
    casper.thenClick("li#wp-admin-bar-edit a");
    casper.thenClick("#delete-action a");

    casper.run(function() { test.done(); });
});

/*casper.test.begin('Wordpress: Batch cache functionality works', function suite(test) {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });

    var link = "http://www.google.com" + "?" + Math.floor(Math.random() * 100);

    casper.thenOpen(getServer('wordpress') + "/wp-admin/post-new.php?post_type=page", function() {
        casper.thenClick("button#content-html");
        this.fillSelectors('form[name="post"]', {
            'input[name="post_title"]':    'Test Page for Cache Now test',
            'textarea[name="content"]':  'Lorem ipsum: <a href="' + link + '">Google</a> and more ipsum'
        }, false);
    });   
     
    casper.thenClick("#publish");

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Dashboard ‹ Amber Wordpress — WordPress");
    });

    casper.thenClick("input#scan");
    casper.waitForText("Done scanning content", function() { 
        this.echo("Done scanning content");
    });
    casper.thenClick("input#stop");

    casper.thenClick("input#cache_now");
    casper.waitForText("Done preserving links", function() { 
        this.echo("Done preserving links");
    });
*/
    // casper.waitForText("These links were cached", function() {
    //         this.echo("Links cached, waiting for 5 seconds");
    //         casper.wait(5000, function() {this.echo("Done waiting");});
    // });

    // casper.thenClick("span#view-post-btn a");

    // casper.then(function() {
    //     test.assertExists('a[href="' + link + '"]');
    //     test.assertTitle("Test Page for Cache Now test | Amber WordPress");
    //     // test.assertExists('a[href="' + link + '"][data-amber-behavior]');
    //     test.assertExists('a[href="' + link + '"][data-versionurl]');
    //     test.assertExists('a[href="' + link + '"][data-versiondate]');
    // });


    // /* Cleanup */
    // casper.thenClick("li#wp-admin-bar-edit a");
    // casper.thenClick("#delete-action a");
/*
    casper.run(function() { test.done(); });
});
*/

casper.test.begin('Wordpress: Delete cache', function suite(test) {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });

    var link = "http://www.google.com" + "?" + Math.floor(Math.random() * 100);

    casper.thenOpen(getServer('wordpress') + "/wp-admin/post-new.php?post_type=page", function() {
        casper.thenClick("button#content-html");
        this.fillSelectors('form[name="post"]', {
            'input[name="post_title"]':    'Test Page for Cache Now test',
            'textarea[name="content"]':  'Lorem ipsum: <a href="' + link + '">Google</a> and more ipsum'
        }, false);
    });   
     
    casper.thenClick("#publish");
    casper.thenClick("input#cache_now");

    casper.waitForText("These links were cached", function() {
            this.echo("Links cached, waiting for 5 seconds");
            casper.wait(5000, function() {this.echo("Done waiting");});
    });

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard", function() {
        test.assertHttpStatus(200);
        test.assertTitle("Amber Dashboard ‹ Amber Wordpress — WordPress");
    });

    var startCacheCount;
    casper.then(function() {
        startCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
    })

    casper.thenClick("table.wp-list-table tbody tr:first-child .delete a");
    casper.wait(5000, function() {this.echo("Waited 5 seconds after deleting row");});

    casper.then(function() {
        var endCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
        test.assertEquals(startCacheCount, endCacheCount + 1, "One cache item deleted");
    })

    casper.run(function() { test.done(); });
});





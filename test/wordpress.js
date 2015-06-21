/**
 * Tests for the Drupal site that can be run immediately after the server comes online
 */

casper.test.begin('Configuring Wordpress', function suite(test) {
    casper.echo("Make sure the Wordpress configuration is setup to allow Amber to work.");
    casper.echo("Needs to be run before any other tests. May be a better way of making this happen");

    wordpress_login();
    wordpress_configure_site();
    casper.run(function() { test.done(); });
});


casper.test.begin('Wordpress: Site with plugin installed is up', function suite(test) {
    casper.start(getServer('wordpress'), function() {
        test.assertHttpStatus(200, "Site is up");     
        test.assertTitle('Amber WordPress | Just another WordPress site', "Site has expected title");
        test.assertTextExists('Proudly powered by WordPress', "Site has expected content on home page");
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: Admin pages are up', function suite(test) {
    wordpress_login();
    wordpress_configure_site();
    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard", function() {
        test.assertHttpStatus(200, "Amber Dashboard is up");
        test.assertTitle("Amber Dashboard ‹ Amber Wordpress — WordPress", "Amber Dashboard has correct title");
    });

    casper.thenOpen(getServer('wordpress') + "/wp-admin/options-general.php?page=amber-setting-admin", function() {
        test.assertHttpStatus(200, "Amber Settings page is up");
        test.assertTitle("Amber Settings ‹ Amber Wordpress — WordPress", "Amber Settings page has correct title");
    });

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: Pages with test content are up before being cached', function suite(test) {
    wordpress_login();

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
        test.assertTitle("Test 1 – Small page with no links | Amber WordPress", "Test page has correct title");
        test.assertTextExists('the peanut is not technically a nut', "Test page displays correct content");
    });

    wordpress_delete_current_page_being_viewed();
    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: "Cache now" functionality works', function suite(test) {
    wordpress_login();
    var link = unique_link();
    wordpress_create_page_with_link_and_cache("Test Page for Cache Now test", link);

    casper.thenClick("span#view-post-btn a");

    casper.then(function() {
        test.assertTitle("Test Page for Cache Now test | Amber WordPress", "Page with cached link has correct title");
        test.assertExists('a[href="' + link + '"]', "Cached link exists");
        test.assertExists('a[href="' + link + '"][data-amber-behavior]', "Cached link has data-amber-behavior attribute");
        test.assertExists('a[href="' + link + '"][data-versionurl]', "Cached link has versionurl attribute");
        test.assertExists('a[href="' + link + '"][data-versiondate]', "Cached link has data-versiondate attribute");
    });

    wordpress_delete_current_page_being_viewed();
    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress: View cache / Test popup', function suite(test) {
    wordpress_login();
    var link = unique_link();
    wordpress_create_page_with_link_and_cache("Test Page for View cache / Test Popup test", link);

    casper.thenClick("span#view-post-btn a");

    /* Testing use of popups for cached pages */
    casper.thenClick('a[href="' + link + '"]');
    casper.thenClick('a.amber-focus');

    /* Check that the cached page has been loaded */
    casper.then(function() {
        test.assertMatch(this.currentResponse.headers.get('Memento-Datetime'), /[A-Za-z]{3}, [0-9].*/,'Memento-Datetime header found');
        test.assertTitle('Amber', "Page framing the cached page has title Amsber");
        test.assertExists('iframe', 'iframe for cached page exists');
    });
    casper.withFrame(0, function() {
        test.assertTitle("Google", "Cached page has correct title");        
        test.assertTextExists('You are viewing an archive', "Embedded Amber banner found");
    })

    casper.then(function() {
        this.back();
    });

    wordpress_delete_current_page_being_viewed();
    casper.run(function() { test.done(); });
});


// casper.test.begin('Wordpress: Batch cache functionality works', function suite(test) {
//     wordpress_login();
//     var link = unique_link();
//     wordpress_create_page_with_link("Test Page for batch cache test", link);

//     casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard");

//     var startCacheCount;
//     var endCacheCount;
//     casper.then(function() {
//         startCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
//     });

//     casper.thenClick("input#scan");
//     casper.waitForText("Done scanning content", function() { 
//         casper.wait(5000, function() {this.echo("Done scanning content and waiting 5 seconds");});
//     });
//     casper.thenClick("input#stop");
//     casper.thenClick("input#cache_now");

//     casper.waitFor(
//         function check() {
//             return this.evaluate(function() {
//                 return (this.fetchText("#batch_status") == "Done preserving links");
//             });
//         },
//         function then() {
//             endCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
//         },
//         function onTimout() {            
//             endCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
//         },  
//         30000 
//     );


//     casper.then(function() {
//         this.echo(startCacheCount);
//         this.echo(endCacheCount);
//         test.assert(endCacheCount > startCacheCount, "Batch caching increased number of items in cache");
//         test.assertSelectorHasText("#amber-stats tbody tr:nth-child(2) td:last-child", "0", "No more items left to cache");
//     });

//     casper.run(function() { test.done(); });
// });


casper.test.begin('Wordpress: Cache view count incremented', function suite(test) {
    wordpress_login();
    var link = unique_link();
    wordpress_create_page_with_link_and_cache("Test Page for cache view increment test", link);

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard");

    var startViewCount;
    casper.then(function() {
        startViewCount = this.fetchText(".wp-list-table tbody tr:first-child td.views");
        if (!startViewCount) {
            startViewCount = 0;
        } else {
            startViewCount = parseInt(startViewCount);
        }

    })

    casper.thenClick("table.wp-list-table tbody tr:first-child .view a");
    casper.wait(5000, function() {this.echo("Waited 5 seconds after viewing row");});

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard", function() {
        var endViewCount = parseInt(this.fetchText(".wp-list-table tbody tr:first-child td.views"));
        test.assertEquals(startViewCount + 1, endViewCount, "Cache view count incremented");
    });

    casper.then(function() {
        this.back();
        this.back();
        this.back();
    });
    wordpress_delete_current_page_being_edited();
    casper.run(function() { test.done(); });
});


casper.test.begin('Wordpress: Delete cache', function suite(test) {
    wordpress_login();
    var link = unique_link();
    wordpress_create_page_with_link_and_cache("Test Page for delete cache test", link);

    casper.thenOpen(getServer('wordpress') + "/wp-admin/tools.php?page=amber-dashboard");

    var startCacheCount;
    casper.then(function() {
        startCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
    })

    casper.thenClick("table.wp-list-table tbody tr:first-child .delete a");
    casper.wait(5000, function() {this.echo("Waited 5 seconds after deleting row");});

    casper.then(function() {
        var endCacheCount = parseInt(this.fetchText("#amber-stats tbody tr:first-child td:last-child"));
        test.assertEquals(startCacheCount, endCacheCount + 1, "One cache item deleted");
    });

    casper.then(function() {
        this.back();
        this.back();
    });

    wordpress_delete_current_page_being_edited();
    casper.run(function() { test.done(); });
});

/****** Utility functions ******/

function unique_link() {
    return "http://www.google.com" + "?" + Math.floor(Math.random() * 1000);
}

function wordpress_login() {
    casper.start(getServer('wordpress') + "/wp-login.php", function() {
        this.fillSelectors('form', {
            'input[name="log"]':    'admin',
            'input[name="pwd"]':    getAdminPassword('wordpress'),
        }, true);
    });    
}

/* Enable permalinks (requried to view cache), and set 'site available' behavior to popup */
function wordpress_configure_site() {
    casper.thenOpen(getServer('wordpress') + "/wp-admin/options-general.php?page=amber-setting-admin", function() {
        this.fillSelectors('form', {
            'select#amber_available_action': 2,            
        }, true);
    });
    casper.thenOpen(getServer('wordpress') + "/wp-admin/options-permalink.php", function() {
        this.click('input[name="selection"][value="/%postname%/"]');
        this.fillSelectors('form', {
        }, true);
    });
}

function wordpress_create_page_with_link(title, link) {
    casper.thenOpen(getServer('wordpress') + "/wp-admin/post-new.php?post_type=page", function() {
        casper.thenClick("button#content-html");
        this.fillSelectors('form[name="post"]', {
            'input[name="post_title"]':    title,
            'textarea[name="content"]':  'Lorem ipsum: <a href="' + link + '">Google</a> and more ipsum'
        }, false);
    });   
     
    casper.thenClick("#publish");
}

function wordpress_create_page_with_link_and_cache(title, link) {
    wordpress_create_page_with_link(title, link);
    casper.thenClick("input#cache_now");

    casper.waitForText("These links were cached", function() {
            this.echo("Links cached, waiting for 5 seconds");
            casper.wait(5000, function() {this.echo("Done waiting");});
    });
}

/* Delete the page currently being viewed */
function wordpress_delete_current_page_being_viewed() {
    casper.thenClick("li#wp-admin-bar-edit a");
    casper.thenClick("#delete-action a");
}

/* Delete the page currently being edited */
function wordpress_delete_current_page_being_edited() {
    casper.thenClick("#delete-action a");
}




/**
 * Tests for the Wordpress and Drupal sites that can be 
 * run immediately after the server comes online
 */

/**** Sniff Tests ****/

// casper.test.begin('Wordpress page sniff test', function suite(test) {
	// testHttpStatus('wordpress', test);
	//test.skip(1, "Skipped one test");

    //casper.run(function() { test.done(); });
// });

casper.test.begin('Drupal page sniff test', function suite(test) {
	testHttpStatus('drupal', test);

    casper.run(function() { test.done(); });
});


/**** Check some basic content on the page ****/

casper.test.begin('Drupal test page sniff test', function suite(test) {
    casper.start(getServer('drupal'), function() {
    	/* Don't check the title, since that will change once content is entered.
    	   Just look for the "Powered by Drupal" text */
	    test.assertTextExists('Powered by');
	});

    casper.run(function() { test.done(); });
});

casper.test.begin('Wordpress test page sniff test', function suite(test) {
    // casper.start(getServer('wordpress'), function() {
	// 	test.assertTitle('Apache2 Ubuntu Default Page: It works');
	//     test.assertTextExists('Please report bugs specific to modules', "Text at the end of the page exists");
	//});
	test.skip(1, "Skipped one test");

    casper.run(function() { test.done(); });
});

/**** Create a page with a link, force caching, and check that cache annotations exists ****/

casper.test.begin('Drupal create page with links', function suite(test) {
    casper.start(getServer('drupal'), function() {
	    this.fillSelectors('form#user-login-form', {
	        'input[name="name"]':    'admin',
	        'input[name="pass"]':    getAdminPassword('drupal'),
	    }, true);
	});

    var link = "http://www.google.com" + "?" + Math.floor(Math.random() * 100);

    casper.thenOpen(getServer('drupal') + "/node/add/article", function() {
	    this.fillSelectors('form#article-node-form', {
	        'input[name="title"]':    'Test Page',
	        '#edit-body-und-0-value':  'Lorem ipsum: ' + link + ' and more ipsum'
	    }, true);
    });   
    
    casper.waitForText("has been created", function() {
    	this.click("ul.tabs li:last-child a");
    });

    casper.waitForText("Sucessfully cached", function() {
		test.assertExists('a[href="' + link + '"]');
		// test.assertExists('a[href="' + link + '"][data-amber-behavior]');
		test.assertExists('a[href="' + link + '"][data-versionurl]');
		test.assertExists('a[href="' + link + '"][data-versiondate]');
    });

// /* Cleanup */
// casper.click(("ul.tabs li:nth-child(2) a"));

// casper.then( function() {
// 	this.debugHTML();
// 	this.click("#edit-delete");
// });

// // , function() {
// //     casper.waitForSelector("#edit-delete", function() {
   // //  	this.debugHTML();
   // //  	this.click("#edit-delete", function() {
// // 		    casper.waitForText("This action cannot be undone", function() {
// // 		    	this.debugHTML();
		 // //    	this.click("#edit-submit");
		 // //    });
   // //  	});
   // //  });
// // });

    casper.run(function() { test.done(); });
});




/**** Utility functions ****/

function testHttpStatus(platform, test) {
    casper.start(getServer(platform), function() {
		test.assertHttpStatus(200);
    });
}



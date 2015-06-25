/**
 * Utility functions for web server tests (Apache/nginx) 
 */

function testHttpStatus(platform, test) {
    casper.start(getServer(platform), function() {
		test.assertHttpStatus(200);
    });
}

function testPage1SimpleNoLinks(platform, test) {
    casper.start(getServer(platform) + "/data/test1.html", function() {
		test.assertHttpStatus(200);
		test.assertTitle("Test 1 - Small page with no links");
	    test.assertTextExists('Peanuts are often served', "Text at the end of the page exists");
	});
}

function testPage2WarAndPeace(platform, test) {
    casper.start(getServer(platform) + "/data/test2.html", function() {
		test.assertHttpStatus(200);
		test.assertTitle("Test 2 - War and Peace");
	    test.assertTextExists('and to recognize a dependence of which we are not conscious.', "Text near the end of the page exists");
	});
}

function testAmberAdminPageCheckURLsAndClearCache(platform, linkCountOnHomePage, test) {
    casper.start(getServer(platform) + "/amber/admin", function() {
		test.assertSelectorHasText('h1','Amber Dashboard');
	});


    casper.then(function() {
    	if (this.exists("a.delete-all")) {
    		this.click("a.delete-all");    		
    	}
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

// the following must be performed after the delete-all test above

function testW03_normal(platform, test, pre) {
  if ( pre ) {
    casper.start( getServer(platform) + "/data/W03_normal.html", function() {
        test.assertHttpStatus(200);
        test.assertTitle("W03_normal / F01");
      } );
  } else {
    casper.start( getServer(platform) + "/amber/admin", function() {
      test.assertTextExists('amberlink.org/fetcher', "amberlink.org has been cached");
    } );
  }
}


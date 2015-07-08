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

//
// the following must be performed after the delete-all test above
//

function testW03_normal(platform, test, pre) {
  if ( pre ) {
    casper.start( getServer(platform) + '/data/W03_normal.html', function() {
        test.assertHttpStatus(200);
        test.assertTitle('W03_normal / F01');
      } );
  } else {
    casper.start( getServer(platform) + '/amber/admin', function() {
      test.assertSelectorHasText( 'tr.cached[data-url="http://amberlink.org/fetcher/"] a', 'amberlink.org/fetcher', 'amberlink.org has been cached' );
    } )
    .thenOpen( getServer(platform) + '/data/W03_normal.html', function() {
      test.assertExists('span[data-issue="11806"]');
    } );
  }
}

function testW03_robots(platform, test, pre) {
  if ( pre ) {
    casper.start( getServer(platform) + '/data/W03_robots.html', function() {
        test.assertHttpStatus(200);
        test.assertTitle('W03_robots');
      } );
  } else {
    casper.start( getServer(platform) + '/amber/admin', function() {
      test.assertSelectorHasText( 'td', 'Blocked by robots.txt', 'surii.net blocked by robots.txt' );
    } );
  }
}

function testW03_malicious(platform, test, pre) {
  // currently not working & not called
  if ( pre ) {
    casper.start( getServer(platform) + '/data/W03_malicious.html', function() {
        test.assertHttpStatus(200);
        test.assertTitle('W03_malicious');
      } );
  } else {
    var testRow = 'tr[data-url="http://trippingthebits.com/amber/ws-malicious.html"]';

    casper.start( getServer(platform) + "/amber/admin" )
    .thenClick( testRow + ' a.view', function() {
      casper.wait( 5000, function() {
        this.echo( 'Waited 5 seconds after viewing cache' );
        test.assertTitle('Malicious Amber WS-Edition', 'Page framing the cached page has title Amber');
        test.assertExists('iframe', 'iframe for cached page exists');
      } )
      .waitForText( 'Amber Dashboard', function() {
        casper.withFrame( 0, function() {
          test.assertExists(testRow, 'admin row visible in cache');
        } );
      } );
    } );
  }
}

function testW06_exclude_regex(platform, test, pre) {
  if ( pre ) {
    casper.start( getServer(platform) + '/data/W06_exclude_regex.html', function() {
        test.assertHttpStatus(200);
        test.assertTitle('W06_exclude_regex');
      } );
  } else {
    casper.start( getServer(platform) + '/amber/admin', function() {
      test.assertDoesntExist( 'tr[data-url="http://api.jquery.com/jQuery.ajax/"]', 'api.jquery.com/jQuery.ajax has been excluded' );
      test.assertExists( 'tr.cached[data-url="http://api.jquery.com/addClass/"]', 'api.jquery.com/addClass has been cached' );
    } );
  }
}

// postcache-only tests

function testViewCountIncremented( platform, test ) {
  var startViewCount;
  var testRow = 'tr[data-url="http://amberlink.org/fetcher/"]';

  casper.start( getServer(platform) + "/amber/admin" )
  .then( function() {
    startViewCount = this.fetchText(testRow + ' td:nth-child(8)');
    startViewCount = startViewCount ? parseInt(startViewCount) : 0;
  } )
  .thenClick( testRow + ' a.view', function() {
    casper.wait( 5000, function() {
      this.echo( 'Waited 5 seconds after viewing cache' );
    } );
  } )
  .thenOpen( getServer(platform) + "/amber/admin" )
  .waitForText( 'Amber Dashboard', function() {
    var endViewCount = parseInt( this.fetchText( testRow + ' td:nth-child(8)' ) );
    test.assertEquals( startViewCount + 1, endViewCount, 'Cache view count incremented' );
  } )
  .run( function() {
    test.done();
  } );
}

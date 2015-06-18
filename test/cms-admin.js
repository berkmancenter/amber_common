/**** Make sure the admin pages exists ****/

casper.test.begin('Drupal check admin pages exist', function suite(test) {
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

// casper.test.begin('Drupal change default option to popup and test cache existence', function suite(test) {
//     casper.start(getServer('drupal'), function() {
// 	    this.fillSelectors('form#user-login-form', {
// 	        'input[name="name"]':    'admin',
// 	        'input[name="pass"]':    getAdminPassword('drupal'),
// 	    }, true);
// 	});

//     casper.thenOpen(getServer('drupal') + "/admin/config/content/amber", function() {
//     });

//     casper.waitForSelector("#amber-config-form", function() {
//     	this.debugHTML();
// 	    this.fillSelectors('#amber-config-form', {
// 	        'select[name="amber_available_action"]':    '2',
// 	    }, true);

//     });

//     casper.run(function() { test.done(); });

// });

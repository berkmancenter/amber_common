<?php

require_once("CAYLFetcher.php");

//class CAYLFetcherTest extends \PHPUnit_Framework_TestCase {
//
//
//
//}

class CAYLRobotsTest extends \PHPUnit_Framework_TestCase {

  public function testRobotsParse()
  {
    $this->assertTrue(CAYLRobots::url_permitted("","www.google.com"));
    $this->assertTrue(CAYLRobots::url_permitted("Donuts","www.google.com"));
    $this->assertFalse(CAYLRobots::url_permitted(<<<EOD
User-agent: *
Disallow: /

EOD
,"/a_url"));
    $this->assertTrue(CAYLRobots::url_permitted(<<<EOD
User-agent: *
Disallow: /man

EOD
,"/a_url"));
    $this->assertFalse(CAYLRobots::url_permitted(<<<EOD
User-agent: *
Disallow: /man

EOD
,"/man/a_url"));
  }

}

class CAYLAssetHelperTest extends \PHPUnit_Framework_TestCase {

  public function provider() {
    return array(array(new CAYLAssetHelper()));
  }

  /**
   * @dataProvider provider
   */
  public function testNullParse(CAYLAssetHelper $a)
  {
    $result = $a->extract_assets("");
    $this->assertTrue(empty($result));
  }

  /**
   * @dataProvider provider
   */
  public function testBogusHTMLParse(CAYLAssetHelper $a)
  {
    $result = $a->extract_assets("<SDFSD>SDFfalsdhf>la<sasdfasdfasdf<DFSFd");
    $this->assertTrue(empty($result));
  }

  /**
   * @dataProvider provider
   */
  public function testOneImage(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<body><img src="../peacock.png">And the band played on....</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertTrue(count($result) == 1);
    $this->assertEquals($result[0],"../peacock.png");
  }

  /**
   * @dataProvider provider
   */
  public function testTwoImages(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<body><img src="../peacock.png">And the band played on....And the <img src="http://band.com/band.jpg"/> said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertEquals(count($result),2);
    $this->assertEquals($result[0],"../peacock.png");
    $this->assertEquals($result[1],"http://band.com/band.jpg");
  }

  /**
   * @dataProvider provider
   */
  public function testStylesheet(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<head><link href="banana.css" rel="stylesheet" type="text.css"></head>
<body>And the band played on....And the BAND said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertTrue(count($result) == 1);
    $this->assertTrue($result[0] == "banana.css");
  }

  /**
   * @dataProvider provider
   */
  public function testJavascript(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<head><script src="banana.js" ></head>
<body>And the band played on....And the BAND said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertTrue(count($result) == 1);
    $this->assertTrue($result[0] == "banana.js");
  }

  /**
   * @dataProvider provider
   */
  public function testMix(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<head><link href="banana.css" rel="stylesheet" type="text.css"><script src="banana.js" type="text/javascript"></head><body><img src="../peacock.png">And the band played on....And the <img src="http://band.com/band.jpg"/> said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertEquals(count($result),4);
    sort($result);
    $this->assertTrue($result[0] == "../peacock.png");
    $this->assertTrue($result[1] == "banana.css");
    $this->assertTrue($result[2] == "banana.js");
    $this->assertEquals($result[3],"http://band.com/band.jpg");

  }

  /**
   * @dataProvider provider
   */
  public function testExpandReferencesSimple(CAYLAssetHelper $a)
  {
    $url = "http://example.com";
    $assets = array("banana.jpg", 'scripts/ban.js');
    $result = $a->expand_asset_references($url,$assets);
    $this->assertEquals($result['banana.jpg']['url'],'http://example.com/banana.jpg');
    $this->assertEquals($result['scripts/ban.js']['url'],'http://example.com/scripts/ban.js');
  }

  /**
   * @dataProvider provider
   */
  public function testExpandReferencesMix(CAYLAssetHelper $a)
  {
    $url = "http://example.com";
    $assets = array("banana.jpg", 'scripts/ban.js', 'http://example.com/example.jpg', 'http://othersite.org/frank/james.css', '//example.com/funky.jpg', '/abs.css');
    $result = $a->expand_asset_references($url,$assets);
    $this->assertEquals(count($result),5);
    $this->assertEquals('http://example.com/banana.jpg',$result['banana.jpg']['url']);
    $this->assertEquals('http://example.com/scripts/ban.js',$result['scripts/ban.js']['url']);
    $this->assertEquals('http://example.com/example.jpg', $result['http://example.com/example.jpg']['url']);
    $this->assertEquals('http://example.com/funky.jpg', $result['//example.com/funky.jpg']['url']);
    $this->assertEquals('http://example.com/abs.css', $result['/abs.css']['url']);
  }

  /**
   * @dataProvider provider
   */
  public function testExpandReferencesWithQuery(CAYLAssetHelper $a)
  {
    $url = "http://example.com";
    $assets = array("banana.jpg", 'scripts/?h=x', 'http://example.com/data/?q=fruit', 'http://othersite.org/frank/james.css', '//example.com/funky.jpg', '/abs.css');
    $result = $a->expand_asset_references($url,$assets);
    $this->assertEquals(count($result),5);
    $this->assertEquals($result['banana.jpg']['url'],'http://example.com/banana.jpg');
    $this->assertEquals($result['scripts/?h=x']['url'],'http://example.com/scripts/?h=x');
    $this->assertEquals($result['http://example.com/data/?q=fruit']['url'],'http://example.com/data/?q=fruit');
    $this->assertEquals($result['//example.com/funky.jpg']['url'],'http://example.com/funky.jpg');
    $this->assertEquals($result['/abs.css']['url'],'http://example.com/abs.css');
  }

  /**
   * @dataProvider provider
   */
  public function testExpandReferencesWithAbsolutePaths(CAYLAssetHelper $a)
  {
    $url = "http://example.com/fruit/cake";
    $assets = array("banana.jpg", 'scripts/?h=x', 'http://example.com/data/?q=fruit', 'http://othersite.org/frank/james.css', '//example.com/funky.jpg', '/abs.css');
    $result = $a->expand_asset_references($url,$assets);
    $this->assertEquals(count($result),5);
    $this->assertEquals($result['banana.jpg']['url'],'http://example.com/fruit/banana.jpg');
    $this->assertEquals($result['scripts/?h=x']['url'],'http://example.com/fruit/scripts/?h=x');
    $this->assertEquals($result['http://example.com/data/?q=fruit']['url'],'http://example.com/data/?q=fruit');
    $this->assertEquals($result['//example.com/funky.jpg']['url'],'http://example.com/funky.jpg');
    $this->assertEquals($result['/abs.css']['url'],'http://example.com/abs.css');
  }

  /**
   * @dataProvider provider
   */
  public function testIgnoreImagesWithInlineData(CAYLAssetHelper $a) {
    $s = <<<EOF
<head><link href="banana.css" rel="stylesheet" type="text.css"><script src="banana.js" type="text/javascript"></head><body><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAASCAMAAAA62ONUAAAB41BMVEVOapxPaJ1QaJ0AnuMAnuMAnuMAnuMAnuMtMnctMnctMnctMnctMncqL3AAnuMAnuMAnuMkRIgAnuMoP4QnOHpScaQtMnc+UY83VZFYeadAVJIrMHMtMncAnuMdTpAsMXQZV5goPYItMncAnuMtMncAmt4AnuMqL3EtMndOaJ4rMHItMncAmNoqL3AAneIAnuMtMncqL28AnuMtMncAltcAnuMtMncAnuMqL3EAlNUsMXYsMHQtMnctMnctMnctMncrMHItMncAAAAbVpgcVZguSYw8T40iXKB/l78YYKMFkdbKzN1MXZZjdaemvtlYcaZXcaZHW5YrSIyaosKIo8c3RYYzS40cWp9JXJZFWpaRnsFJZJ0vOn5gdKdPaJ4mTpJof69GW5acqsk+UI5CWZUDmN1BWZVtga8yVpYpV5pmfq4VZ6o0S4yz2e7h8vrw+f0nQIV9pswPeb4/WpciTZJEWpVVYJe/x9sxQ4W+x9uzu9Oyu9PK1OSnrsstOX5VaJ5acqYOfMHL1ORCUY4RdrvX2OU2TY0cW6A5To1LZJ0ZYaZ+j7gqOX4WaK0Iis+Im8AGkNUhVJm9v9R2jLcDl9wqL28XaK0Rdbrl5e4Ub7QLg8gqL3Dy8vYAldYtMnf///8AnuNA03DVAAAAQ3RSTlP8/v6ImHBkTF9vaoKX62pKkrCCiM3Wj5629o++iBDcs/6XoFA/tUDbcP7HUMjuoTB/74Ag3GBAkNzvobVgkBAwyIAAQngpRwAAAo9JREFUeNqV0mVv3EAQBuCTyswcZuWYjWd7pDIzp8wMYWzaMB3k0Ofx/NSu75KDNB/SV9burK19ZM/aBsXYtbqGhYWF83WNUgQ2HEVWCnNBiRxqWKTVXMge8G9U0TBUUqQPr8jKr1QqHbWKP40r7xMRVK1DFSPQwSEbQ+JuQRUVANnLlnZO5zCk6agqTDneNZnKUS5742rvxaXpWDqXy37sKjJC0pPEo+2ihJyMoh+de5Kedh3sKApYo+sCYo31RLXBsc9mPv7m5eij3sy1mX4zs5SYi+fNEwVG1UBQQUMZOVVHDSOogb8F/ILqRYHVMp5CBVS0hT6ZhbwYH7w9nLk+Zxbz5eSKohUVWWMpKiHoQFWoVo6sbHv6bCzPpsdjK+tvlYqEoqbKGoKTs3NOdkMTcRfqmq7vtL7Ia3s7s5QxK7L028ImEj+s7ssSSDJInWwfehU2K/Wd9QooXkQhInHotYOMyCm2hWj23fTz/ol8Eclnhl/H30/G0t+ZsuHYYkQUfTL6+2F3ImMp94bGR9LWaf+XcniZiNKjD8yBgS7THBrM30/0EctPqIw7QHwQwgYF3EGejGbwGcS7y4o0RSy5O7cy5qXuK/mem3OzUesPFKsUnsI87SNHmHyGwa5tFGBjWQFn1mIWZ2cum4lzPfGR2WVLnVeqFGqFIO11OQK0mcIQJhc1s7GtrCjJqeWCc/bM6em+1KJVZ1GCf5X95PDRppLiIndZYcx8ijnlpL+uRYCI9eQghVtpC2+4DNpKfJh4qFAg0oQYS+UKUi57dx47FVirBHg+WOsgw1XrDvABagvyrNGVCovf046rcTatc8bkK5WF7q496dUi0rLd4/HsaPHDenG0lcqgQUYQqvMXuNS61rudHXMAAAAASUVORK5CYII=">And the band played on....And the <img src="http://band.com/band.jpg"/> said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertEquals(3,count($result));
    sort($result);
    $this->assertEquals($result[0],"banana.css");
    $this->assertEquals($result[1],"banana.js");
    $this->assertEquals($result[2],"http://band.com/band.jpg");

  }

  /**
   * @dataProvider provider
   */
  public function testImagesWithSpacesInURL(CAYLAssetHelper $a) {
    $s = <<<EOF
<head><link href=" banana.css" rel="stylesheet" type="text.css"><script src=" banana.js " type="text/javascript"></head><body><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAASCAMAAAA62ONUAAAB41BMVEVOapxPaJ1QaJ0AnuMAnuMAnuMAnuMAnuMtMnctMnctMnctMnctMncqL3AAnuMAnuMAnuMkRIgAnuMoP4QnOHpScaQtMnc+UY83VZFYeadAVJIrMHMtMncAnuMdTpAsMXQZV5goPYItMncAnuMtMncAmt4AnuMqL3EtMndOaJ4rMHItMncAmNoqL3AAneIAnuMtMncqL28AnuMtMncAltcAnuMtMncAnuMqL3EAlNUsMXYsMHQtMnctMnctMnctMncrMHItMncAAAAbVpgcVZguSYw8T40iXKB/l78YYKMFkdbKzN1MXZZjdaemvtlYcaZXcaZHW5YrSIyaosKIo8c3RYYzS40cWp9JXJZFWpaRnsFJZJ0vOn5gdKdPaJ4mTpJof69GW5acqsk+UI5CWZUDmN1BWZVtga8yVpYpV5pmfq4VZ6o0S4yz2e7h8vrw+f0nQIV9pswPeb4/WpciTZJEWpVVYJe/x9sxQ4W+x9uzu9Oyu9PK1OSnrsstOX5VaJ5acqYOfMHL1ORCUY4RdrvX2OU2TY0cW6A5To1LZJ0ZYaZ+j7gqOX4WaK0Iis+Im8AGkNUhVJm9v9R2jLcDl9wqL28XaK0Rdbrl5e4Ub7QLg8gqL3Dy8vYAldYtMnf///8AnuNA03DVAAAAQ3RSTlP8/v6ImHBkTF9vaoKX62pKkrCCiM3Wj5629o++iBDcs/6XoFA/tUDbcP7HUMjuoTB/74Ag3GBAkNzvobVgkBAwyIAAQngpRwAAAo9JREFUeNqV0mVv3EAQBuCTyswcZuWYjWd7pDIzp8wMYWzaMB3k0Ofx/NSu75KDNB/SV9burK19ZM/aBsXYtbqGhYWF83WNUgQ2HEVWCnNBiRxqWKTVXMge8G9U0TBUUqQPr8jKr1QqHbWKP40r7xMRVK1DFSPQwSEbQ+JuQRUVANnLlnZO5zCk6agqTDneNZnKUS5742rvxaXpWDqXy37sKjJC0pPEo+2ihJyMoh+de5Kedh3sKApYo+sCYo31RLXBsc9mPv7m5eij3sy1mX4zs5SYi+fNEwVG1UBQQUMZOVVHDSOogb8F/ILqRYHVMp5CBVS0hT6ZhbwYH7w9nLk+Zxbz5eSKohUVWWMpKiHoQFWoVo6sbHv6bCzPpsdjK+tvlYqEoqbKGoKTs3NOdkMTcRfqmq7vtL7Ia3s7s5QxK7L028ImEj+s7ssSSDJInWwfehU2K/Wd9QooXkQhInHotYOMyCm2hWj23fTz/ol8Eclnhl/H30/G0t+ZsuHYYkQUfTL6+2F3ImMp94bGR9LWaf+XcniZiNKjD8yBgS7THBrM30/0EctPqIw7QHwQwgYF3EGejGbwGcS7y4o0RSy5O7cy5qXuK/mem3OzUesPFKsUnsI87SNHmHyGwa5tFGBjWQFn1mIWZ2cum4lzPfGR2WVLnVeqFGqFIO11OQK0mcIQJhc1s7GtrCjJqeWCc/bM6em+1KJVZ1GCf5X95PDRppLiIndZYcx8ijnlpL+uRYCI9eQghVtpC2+4DNpKfJh4qFAg0oQYS+UKUi57dx47FVirBHg+WOsgw1XrDvABagvyrNGVCovf046rcTatc8bkK5WF7q496dUi0rLd4/HsaPHDenG0lcqgQUYQqvMXuNS61rudHXMAAAAASUVORK5CYII=">And the band played on....And the <img src="http://band.com/band.jpg"/> said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertEquals(3,count($result));
    sort($result);
    $this->assertEquals($result[0],"banana.css");
    $this->assertEquals($result[1],"banana.js");
    $this->assertEquals($result[2],"http://band.com/band.jpg");
  }

  /**
   * @dataProvider provider
   */
  public function testImagesWithQuerystring(CAYLAssetHelper $a) {
    $s = <<<EOF
<head><link href="banana.css" rel="stylesheet" type="text.css"><script src="banana.js?eatmyshorts=1" type="text/javascript"></head><body><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEUAAAASCAMAAAA62ONUAAAB41BMVEVOapxPaJ1QaJ0AnuMAnuMAnuMAnuMAnuMtMnctMnctMnctMnctMncqL3AAnuMAnuMAnuMkRIgAnuMoP4QnOHpScaQtMnc+UY83VZFYeadAVJIrMHMtMncAnuMdTpAsMXQZV5goPYItMncAnuMtMncAmt4AnuMqL3EtMndOaJ4rMHItMncAmNoqL3AAneIAnuMtMncqL28AnuMtMncAltcAnuMtMncAnuMqL3EAlNUsMXYsMHQtMnctMnctMnctMncrMHItMncAAAAbVpgcVZguSYw8T40iXKB/l78YYKMFkdbKzN1MXZZjdaemvtlYcaZXcaZHW5YrSIyaosKIo8c3RYYzS40cWp9JXJZFWpaRnsFJZJ0vOn5gdKdPaJ4mTpJof69GW5acqsk+UI5CWZUDmN1BWZVtga8yVpYpV5pmfq4VZ6o0S4yz2e7h8vrw+f0nQIV9pswPeb4/WpciTZJEWpVVYJe/x9sxQ4W+x9uzu9Oyu9PK1OSnrsstOX5VaJ5acqYOfMHL1ORCUY4RdrvX2OU2TY0cW6A5To1LZJ0ZYaZ+j7gqOX4WaK0Iis+Im8AGkNUhVJm9v9R2jLcDl9wqL28XaK0Rdbrl5e4Ub7QLg8gqL3Dy8vYAldYtMnf///8AnuNA03DVAAAAQ3RSTlP8/v6ImHBkTF9vaoKX62pKkrCCiM3Wj5629o++iBDcs/6XoFA/tUDbcP7HUMjuoTB/74Ag3GBAkNzvobVgkBAwyIAAQngpRwAAAo9JREFUeNqV0mVv3EAQBuCTyswcZuWYjWd7pDIzp8wMYWzaMB3k0Ofx/NSu75KDNB/SV9burK19ZM/aBsXYtbqGhYWF83WNUgQ2HEVWCnNBiRxqWKTVXMge8G9U0TBUUqQPr8jKr1QqHbWKP40r7xMRVK1DFSPQwSEbQ+JuQRUVANnLlnZO5zCk6agqTDneNZnKUS5742rvxaXpWDqXy37sKjJC0pPEo+2ihJyMoh+de5Kedh3sKApYo+sCYo31RLXBsc9mPv7m5eij3sy1mX4zs5SYi+fNEwVG1UBQQUMZOVVHDSOogb8F/ILqRYHVMp5CBVS0hT6ZhbwYH7w9nLk+Zxbz5eSKohUVWWMpKiHoQFWoVo6sbHv6bCzPpsdjK+tvlYqEoqbKGoKTs3NOdkMTcRfqmq7vtL7Ia3s7s5QxK7L028ImEj+s7ssSSDJInWwfehU2K/Wd9QooXkQhInHotYOMyCm2hWj23fTz/ol8Eclnhl/H30/G0t+ZsuHYYkQUfTL6+2F3ImMp94bGR9LWaf+XcniZiNKjD8yBgS7THBrM30/0EctPqIw7QHwQwgYF3EGejGbwGcS7y4o0RSy5O7cy5qXuK/mem3OzUesPFKsUnsI87SNHmHyGwa5tFGBjWQFn1mIWZ2cum4lzPfGR2WVLnVeqFGqFIO11OQK0mcIQJhc1s7GtrCjJqeWCc/bM6em+1KJVZ1GCf5X95PDRppLiIndZYcx8ijnlpL+uRYCI9eQghVtpC2+4DNpKfJh4qFAg0oQYS+UKUi57dx47FVirBHg+WOsgw1XrDvABagvyrNGVCovf046rcTatc8bkK5WF7q496dUi0rLd4/HsaPHDenG0lcqgQUYQqvMXuNS61rudHXMAAAAASUVORK5CYII=">And the band played on....And the <img src="http://band.com/band.jpg"/> said to the
<a href="leader.html">leader</a>.</body>
EOF;

    $result = $a->extract_assets($s);
    $this->assertEquals(3,count($result));
    sort($result);
    $this->assertEquals($result[0],"banana.css");
    $this->assertEquals($result[1],"banana.js?eatmyshorts=1");
    $this->assertEquals($result[2],"http://band.com/band.jpg");
  }

  /**
   * @dataProvider provider
   */
  public function testCSSAssets(CAYLAssetHelper $a) {
    $s = <<<EOF
div.indentation {
    width: 20px;
    height: 1.7em;
    margin: -0.4em 0.2em -0.4em -0.4em;
    padding: 0.42em 0 0.42em 0.6em;
    float: left;
}

div.tree-child {
    background: url(/misc/tree.png) no-repeat 11px center;
}

div.tree-child-last {
    background: url('/misc/tree1-bottom.png') no-repeat 11px center;
}

div.tree-child-horizontal {
    background: url("/misc/tree1-one.png") no-repeat -11px center;
}
div.tree-child-vertical{
    background: url(  "/misc/tree2-one.png" ) no-repeat -11px center;
}
EOF;

    $result = $a->extract_css_assets($s);
    $this->assertEquals(4,count($result));
    sort($result);
    $this->assertEquals("/misc/tree.png", $result[0]);
    $this->assertEquals("/misc/tree1-bottom.png", $result[1]);
    $this->assertEquals("/misc/tree1-one.png", $result[2]);
    $this->assertEquals("/misc/tree2-one.png", $result[3]);
  }

  /**
   * @dataProvider provider
   */
  public function testWatermarkBanner(CAYLAssetHelper $a)
  {
    $s = <<<EOF
<html><head><script src="banana.js" ></head>
<body>And the band played on....And the BAND said to the
<a href="leader.html">leader</a>.</body></html>
EOF;
    $expected_result = <<<EOF
<html><head><script src="banana.js" ></head>
<body>And the band played on....And the BAND said to the
<a href="leader.html">leader</a>.<div style="position:absolute;top:0;left:0;width:100%;height:30px;z-index:999;background-color:rgba(0,0,0,0.75);color:white;text-align:center;font:bold 18px/30px sans-serif !important;">This is a cached page</div></body></html>
EOF;
    $result = $a->insert_banner($s, "This is a cached page");
    $this->assertEquals($result,$expected_result);
  }



}
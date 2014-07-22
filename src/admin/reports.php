<?php 
	/* Avoid printing any output until we know we don't want to redirect */
	ob_start();

	require_once '../AmberChecker.php';
	require_once '../AmberFetcher.php';
	require_once '../AmberStorage.php';
	require_once '../AmberStatus.php';

	/* Required initialization. The AMBER_CONFIG attribute must be set in the nginx configuration */
	date_default_timezone_set('UTC');
	$config = parse_ini_file($_SERVER['AMBER_CONFIG']);
	$script_location = "/amber/admin/reports.php";

	function get_database($db) {
	  	try {
	    	$db_connection = new PDO('sqlite:' . $db);
	  	} catch (PDOException $e) {
	    	print "Error: Cannot open database: " . $e->getMessage();
	    	exit(1);
	  	}
	  	return $db_connection;
	}

	/* Delete an item */
	function delete($id) {
		global $config;
		$storage = new AmberStorage($config['cache']);
		$storage->clear_cache_item($id);
		$status = new AmberStatus(get_database($config['database']));
		$status->delete($id);
	}

	/* Get the data to display on the report page */
	function get_report() {
		global $config;
		$db = get_database($config['database']);
		$result = $db->query(
			"SELECT c.id, c.url, c.status, c.last_checked, c.message, ca.date, ca.size, ca.location, a.views, a.date as activity_date " .
			"FROM amber_check c " .
			"LEFT JOIN amber_cache ca on ca.id = c.id " .
			"LEFT JOIN amber_activity a on ca.id = a.id ");
		$rows = array();
		while ($row = $result->fetch()) {
			$rows[] = $row;
		}
		$result->closeCursor();
		return $rows;
	}

	/* If a delete request, delete the item and reload the page */
	if (isset($_GET['delete'])) {
		delete($_GET['delete']);
		header("Location: $script_location");
	}

	/* Setup data for display */
	$data = get_report();

	/* No need to cache output anymore */
	ob_end_flush();
?>

<!DOCTYPE html>
<head>
</head>
<body>
<h1>Amber Data</h1>

<table border=1>
<thead>
<tr>
<th>Site</th>
<th>URL</th>
<th>Status</th>
<th>Last Checked</th>
<th>Date Preserved</th>
<th>Size</th>
<th>Last Viewed</th>
<th>Total Views</th>
<th> </th>
<th> </th>
</tr>
</thead>
<tbody>
<?php 
	
	foreach ($data as $row) {
		print "<tr>";
		print("<td>" . htmlspecialchars(parse_url($row['url'],PHP_URL_HOST)) . "</td>");
		print("<td>" . "<a href='" . htmlspecialchars($row['url']) . "'>" . htmlspecialchars($row['url']) . "</a>" . "</td>");
		print("<td>" . ($row['status'] ? "Up" : "Down") . "</td>");
		print("<td>" . (isset($row['last_checked']) ? date("r", $row['last_checked']) : "") . "</td>");
		print("<td>" . (isset($row['date']) ? date("r", $row['date']) : "") . "</td>");
		print("<td>" . (isset($row['size']) ? $row['size'] : (isset($row['message']) ? htmlspecialchars($row['message']) : "")) . "</td>");
		print("<td>" . $row['activity_date'] . "</td>");
		print("<td>" . $row['views'] . "</td>");
		print("<td>" . (isset($row['location']) ? "<a href='/" . htmlspecialchars($row['location']) . "'>View</a>" : "") . "</td>");
		print("<td>" . "<a href='" .$script_location . "?delete=" . $row['id'] . "'>Delete</a>" . "</td>");
		print "</tr>";
	}


?>
</tbody>
</table>


</body>
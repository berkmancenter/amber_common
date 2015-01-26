<?php 
	/* Avoid printing any output until we know we don't want to redirect */
	ob_start();

	require_once '../AmberStorage.php';
	require_once '../AmberStatus.php';
	require_once '../AmberDB.php';

	/* Required initialization. The AMBER_CONFIG attribute must be set in the nginx configuration */
	date_default_timezone_set('UTC');
	$config = parse_ini_file($_SERVER['AMBER_CONFIG']);
	$script_location = "/amber/admin/";

	function get_database($db) {
	  	try {
	    	$db_connection = new PDO('sqlite:' . $db);
	  	} catch (PDOException $e) {
	    	print "Error: Cannot open database: " . $e->getMessage();
	    	exit(1);
	  	}
	  	return $db_connection;
	}

	function cache_size() {
		global $config;
		$db = get_database($config['database']);
		$query = $db->query("SELECT COUNT(*) FROM amber_cache");
		$result = $query->fetch();
    	$query->closeCursor();
	  	return $result[0];
	}

	function queue_size() {
		global $config;
		$db = get_database($config['database']);
		$query = $db->query("SELECT COUNT(*) FROM amber_queue");
		$result = $query->fetch();
    	$query->closeCursor();
	  	return $result[0];
	}

	function disk_usage() {
		global $config;
		$db = get_database($config['database']);
		$status = new AmberStatus(new AmberPDO(get_database($config['database'])));
        $result = round($status->get_cache_size() / (1024 * 1024), 2);        
		return $result ? $result : 0;
	}

	function last_check() {
		global $config;
		$db = get_database($config['database']);
		$result = $db->query("SELECT value FROM amber_variables WHERE name = 'last_run'");
		$row = $result->fetch();
		$result->closeCursor();
		return (empty($row) ? "Never" : date("r", $row[0]));
	}

	/* Delete an item */
	function delete($id) {
		global $config;
		$db = get_database($config['database']);
		$storage = new AmberStorage($config['cache']);
		$status = new AmberStatus(new AmberPDO($db));
		if ($id == "all") {
			$storage->clear_cache();
			$status->delete_all();
			$query = $db->query("DELETE FROM amber_queue");
			$result = $query->fetch();
			$query->closeCursor();
		} else {
			$storage->clear_cache_item($id);
			$status->delete($id);
		}

	}

	/* Export contents of the dashboard detail page as CSV */
	function export() {
	  $data = get_report();

	  $header = array(
	    'Site',
	    'URL',
	    'Status',
	    'Last Checked',
	    'Date preserved',
	    'Size (kB)',
	    'Last viewed',
	    'Total views',
	    'Notes',
	  );

	  $rows = array();
	  foreach ($data as $r) {
	    $host = parse_url($r['url'],PHP_URL_HOST);
	    $rows[] = array(
	      'site' => $host,
	      'url' => $r['url'],
	      'status' => (is_null($r['status']) ? "" : ($r['status'] ? "Up" : "Down")),
	      'last_checked' => isset($r['last_checked']) ? date('c',$r['last_checked']) : "",
	      'date' => isset($r['date']) ? date('c',$r['date']) : "",
	      'size' => round($r['size'] / 1024, 2),
	      'a.date' => isset($r['a_date']) ? date('c',$r['a_date']) : "",
	      'views' => isset($r['views']) ? $r['views'] : 0,
	      'message' => isset($r['message']) ? $r['message'] : ""
	    );
	  }

	  header('Content-Type: text/csv');
	  header('Content-Disposition: attachment;filename=report.csv');

	  $fp = fopen('php://output', 'w');
	  fputcsv($fp, $header);
	  foreach($rows as $line){
	    fputcsv($fp, $line);
	  }
	  fclose($fp);
	  die();
	}


	function get_sort() {
		$result = "";
		if (isset($_GET['sort'])) {
			switch ($_GET['sort']) {
				case 'checked':
					$result = "ORDER BY c.last_checked";
					break;
				case 'cached':
					$result = "ORDER BY ca.date";
					break;
				case 'status':
					$result = "ORDER BY c.status";
					break;
				case 'viewdate':
					$result = "ORDER BY a.date";
					break;
				case 'views':
					$result = "ORDER BY a.views";
					break;
				case 'size':
					$result = "ORDER BY ca.size";
					break;
			}
			if (isset($_GET['dir'])) {
				switch ($_GET['dir']) {
					case "asc":
						$result .= " ASC";
						break;
					case "desc":
						$result .= " DESC";
						break;
				}
			}
		}
		return $result;
	}

	function sort_link($column) {
		global $script_location;
		$href = "${script_location}?sort=${column}";
		if (isset($_GET['sort']) && ($_GET['sort'] == $column)) {
			if (isset($_GET['dir']) && ($_GET['dir'] == "desc")) {
				$href .= "&dir=asc";
			} else {
				$href .= "&dir=desc";
			}
		}
		return $href;
	}

	function page_link($page) {
		global $script_location;
		$href = "${script_location}?page=${page}";
		if (isset($_GET['sort'])) {
			$href .= "&sort=" . $_GET['sort'];			
		}
		if (isset($_GET['dir'])) {
			$href .= "&dir=" . $_GET['dir'];			
		}
		return $href;
	}

	function get_pagenum() {
		return ((isset($_GET['page'])) ? intval($_GET['page']) : 1);
	}

	/* Get the data to display on the report page */
	function get_report($page_num, $num_results) {
		global $config;
		global $script_location;
		$db = get_database($config['database']);
		$statement = 
			"SELECT c.id, c.url, c.status, c.last_checked, c.message, ca.date, ca.size, ca.location, a.views, a.date as activity_date " .
			"FROM amber_check c " .
			"LEFT JOIN amber_cache ca on ca.id = c.id " .
			"LEFT JOIN amber_activity a on ca.id = a.id " .
			"WHERE c.message <> 'Excluded site' ";
		$statement .= get_sort();
		$statement .= " LIMIT " . $num_results . " OFFSET " . ($num_results * ($page_num -1));

		$result = $db->query($statement);
		$rows = array();
		while ($row = $result->fetch()) {
			$rows[] = $row;
		}
		$result->closeCursor();
		return $rows;
	}

	function get_reportCount() {
		global $config;
		$db = get_database($config['database']);
		$statement = 
			"SELECT count(*) as totalCount " .
			"FROM amber_check c " .
			"LEFT JOIN amber_cache ca on ca.id = c.id " .
			"LEFT JOIN amber_activity a on ca.id = a.id " .
			"WHERE c.message <> 'Excluded site' ";
		$query = $db->query($statement);
		
		$result = $query->fetch();
    	$query->closeCursor();
	  	return $result[0];
	}

	/* If a delete request, delete the item and reload the page */
	if (isset($_GET['delete'])) {
		delete($_GET['delete']);
		header("Location: $script_location");
	} else if (isset($_GET['export'])) {
		export();
	}

	$per_page = 50;
    $current_page = get_pagenum();
    $total_items = get_reportCount();
    $page_count = ceil($total_items / $per_page);
	/* Setup data for display */
	$data = get_report($current_page, $per_page);

	/* Handle paging */
//    $data = array_slice($data,(($current_page-1)*$per_page),$per_page);


	/* No need to cache output anymore */
	ob_end_flush();
?>

<!DOCTYPE html>
<head>
<meta name="robots" content="nofollow" />
</head>
<body>

<h1>Amber Dashboard</h1>

<table>
	<tr>
		<td>
			<h2>Global Statistics</h2>
		</td>
		<td>
			<h2>Storage Settings</h2>
		</td>
	</tr>
	<tr>
		<td valign="top">
			<table border=1>
				<tbody>
					<tr><td>Captures preserved</td><td><?php print(cache_size()); ?></td></tr>
					<tr><td>Links to capture</td><td><?php print(queue_size()); ?></td></tr>
					<tr><td>Last check</td><td><?php print(last_check()); ?></td></tr>
					<tr><td>Disk space used</td><td><?php print(disk_usage() . " of " . $config['amber_max_disk']); ?> MB</td></tr>
					<tr><td>Configuration file</td><td><?php print($_SERVER['AMBER_CONFIG']); ?></td></tr>
				</tbody>
			</table>
			<a href="<?php print $script_location ?>?delete=all">Delete all captures</a>
		</td>

		<td valign="top">
			<table border=1>
				<thead>
					<tr>
						<th>Setting</th>
						<th>Value</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>Maximum file size (kB)</td><td><?php print $config['amber_max_file']; ?></td></tr>
					<tr><td>Maximum disk usage (MB)</td><td><?php print $config['amber_max_disk']; ?></td></tr>
					<tr><td>Database location</td><td><?php print $config['database']; ?></td></tr>
					<tr><td>Storage location</td><td><?php print $config['cache']; ?></td></tr>
					<tr><td>Update captures periodically</td><td><?php print ($config['amber_update_strategy'] ? "Yes" : "No"); ?></td></tr>
					<tr><td valign="top">Excluded sites</td><td><?php print join("<br/>",$config['amber_excluded_sites']); ?></td></tr>
					<tr><td valign="top">Excluded file formats</td><td><?php print join("<br>", $config['amber_excluded_formats']); ?></td></tr>
					</tr>
				</tbody>
			</table>
		</td>
	</tr>
</table>

<h2>Amber Data</h2>

<?php 
if ($total_items > 0) { ?>
	Showing items <?php print ($per_page * ($current_page - 1) + 1); ?> to <?php print (min($total_items, $current_page * $per_page)); ?> of <?php print($total_items); ?>.
<?php } ?>

<br/>
<?php 
	if ($current_page > 1) { print ("<a href='" . page_link(1) . "'>First</a> "); }
	if ($current_page > 1) { print ("<a href='" . page_link($current_page - 1) . "'>Previous</a> "); }
	if ($current_page * $per_page < $total_items) { print ("<a href='" . page_link($current_page + 1) . "'>Next</a> "); }
	if ($current_page * $per_page < $total_items) { print ("<a href='" . page_link($page_count) . "'>Last</a> "); }
?>
<table border=1>
<thead>
<tr>
<th>Site</th>
<th>URL</th>
<th><a href='<?php print sort_link("status"); ?>'>Status</a></th>
<th><a href='<?php print sort_link("checked"); ?>'>Last Checked</a></th>
<th><a href='<?php print sort_link("cached"); ?>'>Date Preserved</a></th>
<th><a href='<?php print sort_link("size"); ?>'>Size (kB)</a></th>
<th><a href='<?php print sort_link("viewdate"); ?>'>Last Viewed</a></th>
<th><a href='<?php print sort_link("views"); ?>'>Total Views</a></th>
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
		print("<td>" . (is_null($row['status']) ? "" : ($row['status'] ? "Up" : "Down")) . "</td>");
		print("<td>" . (isset($row['last_checked']) ? date("r", $row['last_checked']) : "") . "</td>");
		print("<td>" . (isset($row['date']) ? date("r", $row['date']) : "") . "</td>");
		print("<td>" . (isset($row['size']) ? round($row['size']/1024,2) : (isset($row['message']) ? htmlspecialchars($row['message']) : "")) . "</td>");
		print("<td>" . (isset($row['activity_date']) ? date("r", $row['activity_date']) : "") . "</td>");
		print("<td>" . $row['views'] . "</td>");
		print("<td>" . (isset($row['location']) ? "<a href='/" . htmlspecialchars($row['location']) . "'>View</a>" : "") . "</td>");
		print("<td>" . "<a href='" .$script_location . "?delete=" . $row['id'] . "'>Delete</a>" . "</td>");
		print "</tr>";
	}


?>
</tbody>
</table>
<a href="<?php print $script_location ?>?export">Export</a>


</body>
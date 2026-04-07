<?php

class GS_Activator {
	public static function activate() {
		global $wpdb;
		$charset_collate = $wpdb->get_charset_collate();

		$table_blocks = $wpdb->prefix . 'gs_blocks';
		$sql_blocks = "CREATE TABLE $table_blocks (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			field_id bigint(20) UNSIGNED NOT NULL,
			name varchar(255) NOT NULL,
			row_index int NOT NULL DEFAULT 0,
			col_index int NOT NULL DEFAULT 0,
			length float NOT NULL DEFAULT 10,
			bed_width float NOT NULL DEFAULT 0.75,
			PRIMARY KEY  (id)
		) $charset_collate;";

		$table_beds = $wpdb->prefix . 'gs_beds';
		$sql_beds = "CREATE TABLE $table_beds (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			block_id mediumint(9) NOT NULL,
			name varchar(255) NOT NULL,
			width float NOT NULL DEFAULT 0.75,
			length float NOT NULL DEFAULT 10,
			PRIMARY KEY  (id)
		) $charset_collate;";

		$table_cultivations = $wpdb->prefix . 'gs_cultivations';
		$sql_cultivations = "CREATE TABLE $table_cultivations (
			id mediumint(9) NOT NULL AUTO_INCREMENT,
			bed_id mediumint(9) NOT NULL,
			crop_id bigint(20) UNSIGNED NOT NULL,
			year int NOT NULL,
			quantity float NOT NULL DEFAULT 0,
			start_date date,
			sow_date date,
			harvest_date date,
			end_date date,
			PRIMARY KEY  (id)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql_blocks );
		dbDelta( $sql_beds );
		dbDelta( $sql_cultivations );
	}
}

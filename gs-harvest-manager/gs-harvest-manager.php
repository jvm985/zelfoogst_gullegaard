<?php
/**
 * Plugin Name: Gullegaard Harvest Manager
 * Plugin URI:  https://mijn-csa.be
 * Description: Beheer veldstructuur, oogst en recepten voor een zelfoogstboerderij.
 * Version:     1.0.3
 * Author:      Gullegaard
 * Text Domain: gs-harvest-manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'GS_HARVEST_MANAGER_VERSION', '1.0.3' );
define( 'GS_HARVEST_MANAGER_PATH', plugin_dir_path( __FILE__ ) );
define( 'GS_HARVEST_MANAGER_URL', plugin_dir_url( __FILE__ ) );

/**
 * The code that runs during plugin activation.
 */
function activate_gs_harvest_manager() {
	require_once GS_HARVEST_MANAGER_PATH . 'includes/class-gs-activator.php';
	GS_Activator::activate();
}
register_activation_hook( __FILE__, 'activate_gs_harvest_manager' );

/**
 * The code that runs during plugin deactivation.
 */
function deactivate_gs_harvest_manager() {
	// Optional: cleanup
}
register_deactivation_hook( __FILE__, 'deactivate_gs_harvest_manager' );

/**
 * Core class used to load everything.
 */
require GS_HARVEST_MANAGER_PATH . 'includes/class-gs-harvest-manager.php';

function run_gs_harvest_manager() {
	$plugin = new GS_Harvest_Manager();
	$plugin->run();
}
run_gs_harvest_manager();

<?php

class GS_Harvest_Manager {
	protected $loader;
	protected $plugin_name;
	protected $version;

	public function __construct() {
		$this->plugin_name = 'gs-harvest-manager';
		$this->version = GS_HARVEST_MANAGER_VERSION;
		$this->load_dependencies();
		$this->define_admin_hooks();
		$this->define_public_hooks();
	}

	private function load_dependencies() {
		require_once GS_HARVEST_MANAGER_PATH . 'includes/class-gs-cpts.php';
		require_once GS_HARVEST_MANAGER_PATH . 'includes/class-gs-admin.php';
		require_once GS_HARVEST_MANAGER_PATH . 'includes/class-gs-api.php';
		require_once GS_HARVEST_MANAGER_PATH . 'includes/class-gs-shortcodes.php';
	}

	private function define_admin_hooks() {
		$admin = new GS_Admin( $this->get_plugin_name(), $this->get_version() );
		add_action( 'admin_enqueue_scripts', array( $admin, 'enqueue_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $admin, 'enqueue_scripts' ) );
		add_action( 'admin_menu', array( $admin, 'add_plugin_admin_menu' ) );
        
        $cpts = new GS_CPTs();
        add_action( 'init', array( $cpts, 'register_cpts' ) );
	}

	private function define_public_hooks() {
		$public = new GS_Shortcodes( $this->get_plugin_name(), $this->get_version() );
		add_shortcode( 'gs_harvest_map', array( $public, 'render_harvest_map' ) );
		add_shortcode( 'gs_recipes', array( $public, 'render_recipes' ) );

        $api = new GS_API();
        add_action( 'rest_api_init', array( $api, 'register_routes' ) );
	}

	public function run() {
		// Execution starts here
	}

	public function get_plugin_name() {
		return $this->plugin_name;
	}

	public function get_version() {
		return $this->version;
	}
}

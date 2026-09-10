<?php
/**
 * Plugin Name: Jago Sales & Marketing Executive Portal
 * Plugin URI:  https://github.com/MDWebnexIT/jago
 * Description: Executive Sales Management System for Jago Corporation PLC. Features Central Daybook, Customer Directory, Party Ledgers, Conveyance Claim Vouchers, Market Sales Reports, and Shareable Public Links.
 * Version:     1.0.0
 * Author:      Jago Corporation PLC
 * Author URI:  https://github.com/MDWebnexIT/jago
 * License:     GPLv2 or later
 * Text Domain: jago-sales-portal
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

define('JAGO_PORTAL_PATH', plugin_dir_path(__FILE__));
define('JAGO_PORTAL_URL', plugin_dir_url(__FILE__));

class Jago_Sales_Portal_Plugin {

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_shortcode('jago_sales_portal', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));

        // AJAX hooks for logged-in and public users
        add_action('wp_ajax_jago_load_data', array($this, 'ajax_load_data'));
        add_action('wp_ajax_nopriv_jago_load_data', array($this, 'ajax_load_data'));
        add_action('wp_ajax_jago_save_data', array($this, 'ajax_save_data'));
        add_action('wp_ajax_nopriv_jago_save_data', array($this, 'ajax_save_data'));
    }

    public function add_admin_menu() {
        add_menu_page(
            'Jago Sales Portal',
            'Jago Sales',
            'manage_options',
            'jago-sales-portal',
            array($this, 'render_admin_page'),
            'dashicons-chart-bar',
            6
        );
    }

    public function render_admin_page() {
        echo '<div class="wrap">';
        echo '<h1>Jago Corporation PLC - Executive Sales Portal</h1>';
        echo '<p>Use the shortcode <code>[jago_sales_portal]</code> on any page to display the Sales Portal UI to your users.</p>';
        echo '<div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #ccc; max-width:800px;">';
        echo '<h3>Plugin Status: Active & Configured</h3>';
        echo '<p>WordPress database sync is enabled. All Daybook records, customer accounts, conveyance vouchers, and reports are saved to your WordPress site database.</p>';
        echo '</div></div>';
    }

    public function enqueue_scripts() {
        wp_enqueue_style('inter-font', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
        wp_enqueue_style('remix-icon', 'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css');
        wp_enqueue_script('chart-js', 'https://cdn.jsdelivr.net/npm/chart.js', array(), null, true);
        
        wp_enqueue_style('jago-styles', JAGO_PORTAL_URL . 'css/styles.css', array(), '1.0.0');
        wp_enqueue_style('jago-mobile-styles', JAGO_PORTAL_URL . 'css/mobile.css', array(), '1.0.0');

        wp_enqueue_script('jago-storage', JAGO_PORTAL_URL . 'js/storage.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-customers', JAGO_PORTAL_URL . 'js/customers.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-items', JAGO_PORTAL_URL . 'js/items.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-daybook', JAGO_PORTAL_URL . 'js/daybook.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-conveyance', JAGO_PORTAL_URL . 'js/conveyance.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-reports', JAGO_PORTAL_URL . 'js/reports.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-invoices', JAGO_PORTAL_URL . 'js/invoices.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-ledger', JAGO_PORTAL_URL . 'js/ledger.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-master-input', JAGO_PORTAL_URL . 'js/master_input.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-html2pdf', JAGO_PORTAL_URL . 'js/html2pdf.bundle.min.js', array(), '1.0.0', true);
        wp_enqueue_script('jago-app', JAGO_PORTAL_URL . 'js/app.js', array('jquery'), '1.0.0', true);

        wp_localize_script('jago-storage', 'jagoWpVars', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('jago_portal_nonce')
        ));
    }

    public function render_shortcode() {
        ob_start();
        include JAGO_PORTAL_PATH . 'template-app.php';
        return ob_get_clean();
    }

    public function ajax_load_data() {
        $data = get_option('jago_master_database_v1');
        if ($data) {
            echo $data;
            wp_die();
        } else {
            wp_send_json_error(array('message' => 'No data initialized'));
        }
    }

    public function ajax_save_data() {
        $input = file_get_contents('php://input');
        if (!empty($input)) {
            update_option('jago_master_database_v1', $input);
            wp_send_json_success(array('message' => 'Saved to WordPress Database'));
        } else {
            wp_send_json_error(array('message' => 'Empty payload'));
        }
    }
}

new Jago_Sales_Portal_Plugin();

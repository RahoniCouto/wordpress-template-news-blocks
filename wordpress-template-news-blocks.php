<?php

/**
 * Plugin Name: WordPress Template News Blocks
 * Description: Blocos Gutenberg editoriais para o tema WordPress Template News.
 * Version: 0.1.0
 * Requires at least: 6.7
 * Requires PHP: 8.1
 * Author: Rahoni Couto
 * Text Domain: wordpress-template-news-blocks
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

define('WTN_BLOCKS_VERSION', '0.1.0');
define('WTN_BLOCKS_PATH', plugin_dir_path(__FILE__));
define('WTN_BLOCKS_URL', plugin_dir_url(__FILE__));

require_once WTN_BLOCKS_PATH . 'inc/setup.php';
require_once WTN_BLOCKS_PATH . 'inc/settings.php';
require_once WTN_BLOCKS_PATH . 'inc/content/reading-time.php';
require_once WTN_BLOCKS_PATH . 'inc/heading-context.php';
require_once WTN_BLOCKS_PATH . 'inc/post-context.php';
require_once WTN_BLOCKS_PATH . 'inc/post-selection.php';
require_once WTN_BLOCKS_PATH . 'inc/editorial-post-overrides.php';
require_once WTN_BLOCKS_PATH . 'inc/editorial-post-data.php';
require_once WTN_BLOCKS_PATH . 'inc/rest/editorial-post-selection.php';
require_once WTN_BLOCKS_PATH . 'inc/blocks.php';

add_action('plugins_loaded', 'wtn_blocks_setup');
add_action('admin_init', 'wtn_blocks_register_settings');
add_action('admin_menu', 'wtn_blocks_register_settings_page');
add_filter('block_editor_settings_all', 'wtn_blocks_add_block_editor_settings');

add_action('init', 'wtn_blocks_register_reading_time_meta');
add_action('init', 'wtn_blocks_register_blocks');

add_action(
    'rest_api_init',
    'wtn_blocks_register_editorial_post_selection_routes'
);

add_action(
    'wp_after_insert_post',
    'wtn_blocks_update_reading_time_meta',
    10,
    2
);

<?php

/**
 * Plugin Name: WordPress Template News Blocks
 * Plugin URI: https://github.com/seu-usuario/wordpress-template-news-blocks
 * Description: Gutenberg blocks plugin criado para usar em conjunto com o template wordpress-template-news.
 * Version: 0.1.0
 * Requires at least: 6.5
 * Requires PHP: 8.0
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
require_once WTN_BLOCKS_PATH . 'inc/heading-context.php';
require_once WTN_BLOCKS_PATH . 'inc/post-context.php';
require_once WTN_BLOCKS_PATH . 'inc/blocks.php';

add_action('plugins_loaded', 'wtn_blocks_setup');
add_action('init', 'wtn_blocks_register_blocks');

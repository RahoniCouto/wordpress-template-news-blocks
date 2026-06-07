<?php
/**
 * Block registration.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Registers plugin blocks.
 */
function wtn_blocks_register_blocks(): void
{
    $editorial_hero_path = WTN_BLOCKS_PATH . 'build/blocks/editorial-hero';

    if (file_exists($editorial_hero_path . '/block.json')) {
        register_block_type($editorial_hero_path);
    }
}
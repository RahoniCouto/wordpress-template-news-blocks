<?php

/**
 * Reading time data.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Registers the persisted reading-time value for posts.
 */
function wtn_blocks_register_reading_time_meta(): void
{
    register_post_meta(
        'post',
        '_wtn_reading_time_minutes',
        [
            'type'              => 'integer',
            'single'            => true,
            'sanitize_callback' => 'absint',
            'show_in_rest'      => true,
        ]
    );
}

/**
 * Calculates reading time from post content.
 *
 * @param string $content Post content.
 * @return int Reading time in minutes, or zero when there is no readable text.
 */
function wtn_blocks_calculate_reading_time_minutes(string $content): int
{
    if ('' === trim($content)) {
        return 0;
    }

    $content = preg_replace(
        '/<!--\s*\/?wp:[\s\S]*?-->/',
        ' ',
        $content
    );

    if (! is_string($content)) {
        return 0;
    }

    $content = strip_shortcodes($content);
    $content = wp_strip_all_tags($content, true);
    $content = html_entity_decode(
        $content,
        ENT_QUOTES | ENT_HTML5,
        get_bloginfo('charset') ?: 'UTF-8'
    );

    preg_match_all('/\p{L}+/u', $content, $matches);

    $word_count = isset($matches[0])
        ? count($matches[0])
        : 0;

    if (0 === $word_count) {
        return 0;
    }

    return max(
        1,
        (int) ceil($word_count / 200)
    );
}

/**
 * Returns the persisted reading time for a post.
 *
 * @param int $post_id Post ID.
 * @return int Reading time in minutes, or zero when unavailable.
 */
function wtn_blocks_get_reading_time_minutes(int $post_id): int
{
    return absint(
        get_post_meta(
            $post_id,
            '_wtn_reading_time_minutes',
            true
        )
    );
}

/**
 * Returns the formatted persisted reading-time label for a post.
 *
 * @param int $post_id Post ID.
 * @return string
 */
function wtn_blocks_get_reading_time_label(int $post_id): string
{
    $minutes = wtn_blocks_get_reading_time_minutes($post_id);

    if (0 === $minutes) {
        return '';
    }

    return sprintf(
        _n(
            '%d min de leitura',
            '%d min de leitura',
            $minutes,
            'wordpress-template-news-blocks'
        ),
        $minutes
    );
}

/**
 * Updates the persisted reading time after a post is saved.
 *
 * @param int     $post_id Post ID.
 * @param WP_Post $post    Post object after it has been saved.
 */
function wtn_blocks_update_reading_time_meta(
    int $post_id,
    WP_Post $post
): void {
    if ('post' !== $post->post_type) {
        return;
    }

    $minutes = wtn_blocks_calculate_reading_time_minutes(
        (string) $post->post_content
    );

    if (0 === $minutes) {
        delete_post_meta(
            $post_id,
            '_wtn_reading_time_minutes'
        );

        return;
    }

    update_post_meta(
        $post_id,
        '_wtn_reading_time_minutes',
        $minutes
    );
}

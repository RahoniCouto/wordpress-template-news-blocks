<?php

/**
 * Editorial post selection helpers.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Checks whether a post is valid for editorial selection.
 *
 * @param int $post_id     Post ID.
 * @param int $category_id Optional category ID.
 * @return bool
 */
function wtn_blocks_is_selectable_post(int $post_id, int $category_id = 0): bool
{
    $post_id     = absint($post_id);
    $category_id = absint($category_id);

    if (0 === $post_id) {
        return false;
    }

    $post = get_post($post_id);

    if (
        ! $post instanceof WP_Post
        || 'post' !== $post->post_type
        || 'publish' !== get_post_status($post)
    ) {
        return false;
    }

    if (
        $category_id > 0
        && ! has_category($category_id, $post)
    ) {
        return false;
    }

    return true;
}

/**
 * Resolves the posts used by a News Section.
 *
 * Manual IDs represent the four editorial slots in this order:
 *
 * 0: featured post.
 * 1: secondary post.
 * 2: secondary post.
 * 3: secondary post.
 *
 * In automatic mode, empty or invalid slots are filled with the newest
 * eligible posts.
 *
 * In manual mode, only explicitly selected valid posts are returned.
 *
 * @param string $selection_mode Selection mode: automatic or manual.
 * @param int    $category_id    Optional category ID.
 * @param int[]  $slot_post_ids  Manual post IDs indexed by slot.
 * @return array<int, int>
 */
function wtn_blocks_resolve_news_section_posts(
    string $selection_mode,
    int $category_id,
    array $slot_post_ids
): array {
    $selection_mode = in_array($selection_mode, ['automatic', 'manual'], true)
        ? $selection_mode
        : 'automatic';

    $category_id = absint($category_id);

    $slot_post_ids = array_slice(
        array_pad(array_map('absint', $slot_post_ids), 4, 0),
        0,
        4
    );

    $used_post_ids = function_exists('wtn_blocks_get_used_post_ids')
        ? wtn_blocks_get_used_post_ids()
        : [];

    $used_post_ids = array_values(
        array_unique(
            array_filter(
                array_map('absint', $used_post_ids)
            )
        )
    );

    $resolved_posts  = [0, 0, 0, 0];
    $reserved_posts  = [];
    $seen_manual_ids = [];

    foreach ($slot_post_ids as $slot_index => $post_id) {
        if (0 === $post_id) {
            continue;
        }

        if (in_array($post_id, $seen_manual_ids, true)) {
            continue;
        }

        $seen_manual_ids[] = $post_id;

        if (in_array($post_id, $used_post_ids, true)) {
            continue;
        }

        if (! wtn_blocks_is_selectable_post($post_id, $category_id)) {
            continue;
        }

        $resolved_posts[$slot_index] = $post_id;
        $reserved_posts[]            = $post_id;
    }

    if ('manual' === $selection_mode) {
        return $resolved_posts;
    }

    $automatic_slots = array_keys(
        array_filter(
            $resolved_posts,
            static fn(int $post_id): bool => 0 === $post_id
        )
    );

    if (empty($automatic_slots)) {
        return $resolved_posts;
    }

    $excluded_post_ids = array_values(
        array_unique(
            array_merge(
                $used_post_ids,
                $reserved_posts
            )
        )
    );

    $query_args = [
        'post_type'              => 'post',
        'post_status'            => 'publish',
        'posts_per_page'         => count($automatic_slots),
        'orderby' => [
            'date' => 'DESC',
            'ID'   => 'DESC',
        ],
        'post__not_in'           => $excluded_post_ids,
        'ignore_sticky_posts'    => true,
        'no_found_rows'          => true,
        'update_post_meta_cache' => false,
        'update_post_term_cache' => false,
        'fields'                 => 'ids',
    ];

    if ($category_id > 0) {
        $query_args['cat'] = $category_id;
    }

    $automatic_query = new WP_Query($query_args);
    $automatic_posts = array_map('absint', $automatic_query->posts);

    foreach ($automatic_slots as $slot_index) {
        $post_id = array_shift($automatic_posts);

        if (! $post_id) {
            break;
        }

        $resolved_posts[$slot_index] = $post_id;
    }

    return $resolved_posts;
}

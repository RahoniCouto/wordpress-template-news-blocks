<?php

/**
 * Editorial post selection REST endpoints.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Checks whether the current user can resolve editorial posts in the editor.
 *
 * @return bool
 */
function wtn_blocks_can_resolve_editorial_posts(): bool
{
    return current_user_can('edit_posts');
}

/**
 * Resolves News Section post IDs for the block editor.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response
 */
function wtn_blocks_rest_resolve_news_section_posts(
    WP_REST_Request $request
): WP_REST_Response {
    $resolved_post_ids = wtn_blocks_resolve_news_section_posts(
        (string) $request->get_param('selectionMode'),
        absint($request->get_param('categoryId')),
        (array) $request->get_param('slotPostIds'),
        (array) $request->get_param('excludedPostIds')
    );

    return rest_ensure_response(
        [
            'postIds' => $resolved_post_ids,
        ]
    );
}

/**
 * Resolves Latest News post IDs for the block editor.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response
 */
function wtn_blocks_rest_resolve_latest_news_posts(
    WP_REST_Request $request
): WP_REST_Response {
    $resolved_post_ids = wtn_blocks_resolve_latest_news_posts(
        absint($request->get_param('categoryId')),
        absint($request->get_param('postCount')),
        (array) $request->get_param('excludedPostIds')
    );

    return rest_ensure_response(
        [
            'postIds' => $resolved_post_ids,
        ]
    );
}

/**
 * Registers editorial post selection REST routes.
 */
function wtn_blocks_register_editorial_post_selection_routes(): void
{
    register_rest_route(
        'wtn-blocks/v1',
        '/news-section/resolve',
        [
            'methods'             => 'POST',
            'callback'            => 'wtn_blocks_rest_resolve_news_section_posts',
            'permission_callback' => 'wtn_blocks_can_resolve_editorial_posts',
            'args'                => [
                'selectionMode' => [
                    'type'    => 'string',
                    'enum'    => ['automatic', 'manual'],
                    'default' => 'automatic',
                ],
                'categoryId' => [
                    'type'    => 'integer',
                    'minimum' => 0,
                    'default' => 0,
                ],
                'slotPostIds' => [
                    'type'     => 'array',
                    'maxItems' => 4,
                    'default'  => [0, 0, 0, 0],
                    'items'    => [
                        'type'    => 'integer',
                        'minimum' => 0,
                    ],
                ],
                'excludedPostIds' => [
                    'type'     => 'array',
                    'maxItems' => WTN_BLOCKS_MAX_EXCLUDED_POST_IDS,
                    'default'  => [],
                    'items'    => [
                        'type'    => 'integer',
                        'minimum' => 0,
                    ],
                ],
            ],
        ]
    );

    register_rest_route(
        'wtn-blocks/v1',
        '/latest-news/resolve',
        [
            'methods'             => 'POST',
            'callback'            => 'wtn_blocks_rest_resolve_latest_news_posts',
            'permission_callback' => 'wtn_blocks_can_resolve_editorial_posts',
            'args'                => [
                'categoryId' => [
                    'type'    => 'integer',
                    'minimum' => 0,
                    'default' => 0,
                ],
                'postCount' => [
                    'type'    => 'integer',
                    'enum'    => [3, 4, 5],
                    'default' => 4,
                ],
                'excludedPostIds' => [
                    'type'     => 'array',
                    'maxItems' => WTN_BLOCKS_MAX_EXCLUDED_POST_IDS,
                    'default'  => [],
                    'items'    => [
                        'type'    => 'integer',
                        'minimum' => 0,
                    ],
                ],
            ],
        ]
    );
}

<?php

/**
 * Author profile data.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

const WTN_AUTHOR_META_VERIFIED = 'wtn_author_verified';
const WTN_AUTHOR_META_PHOTO_ID = 'wtn_author_photo_id';
const WTN_AUTHOR_META_MINI_BIO = 'wtn_author_mini_bio';
const WTN_AUTHOR_META_EDITORIAL_ROLE = 'wtn_author_editorial_role';
const WTN_AUTHOR_META_SOCIAL_X_URL = 'wtn_author_social_x_url';
const WTN_AUTHOR_META_SOCIAL_INSTAGRAM_URL = 'wtn_author_social_instagram_url';
const WTN_AUTHOR_META_SOCIAL_LINKEDIN_URL = 'wtn_author_social_linkedin_url';

/**
 * Registers the editorial author metadata owned by the companion plugin.
 */
function wtn_blocks_register_author_profile_meta(): void
{
    $meta_definitions = [
        WTN_AUTHOR_META_VERIFIED => [
            'type'              => 'boolean',
            'description'       => __('Indica se o autor possui verificação editorial.', 'wordpress-template-news-blocks'),
            'single'            => true,
            'default'           => false,
            'sanitize_callback' => 'rest_sanitize_boolean',
            'show_in_rest'      => false,
        ],
        WTN_AUTHOR_META_PHOTO_ID => [
            'type'              => 'integer',
            'description'       => __('ID da foto editorial do autor.', 'wordpress-template-news-blocks'),
            'single'            => true,
            'default'           => 0,
            'sanitize_callback' => 'absint',
            'auth_callback'     => '__return_false',
            'show_in_rest'      => [
                'schema' => [
                    'readonly' => true,
                ],
                'prepare_callback' => static function ($value): int {
                    $photo_id = absint($value);

                    return wtn_blocks_is_accessible_image_attachment($photo_id)
                        ? $photo_id
                        : 0;
                },
            ],
        ],
        WTN_AUTHOR_META_MINI_BIO => [
            'type'              => 'string',
            'description'       => __('Mini bio editorial do autor.', 'wordpress-template-news-blocks'),
            'single'            => true,
            'default'           => '',
            'sanitize_callback' => 'sanitize_textarea_field',
            'show_in_rest'      => false,
        ],
        WTN_AUTHOR_META_EDITORIAL_ROLE => [
            'type'              => 'string',
            'description'       => __('Cargo editorial curto do autor.', 'wordpress-template-news-blocks'),
            'single'            => true,
            'default'           => '',
            'sanitize_callback' => 'sanitize_text_field',
            'show_in_rest'      => [
                'schema' => [
                    'readonly' => true,
                ],
                'prepare_callback' => static function ($value): string {
                    return trim((string) $value);
                },
            ],
        ],
    ];

    $social_meta = [
        WTN_AUTHOR_META_SOCIAL_X_URL,
        WTN_AUTHOR_META_SOCIAL_INSTAGRAM_URL,
        WTN_AUTHOR_META_SOCIAL_LINKEDIN_URL,
    ];

    foreach ($social_meta as $meta_key) {
        $meta_definitions[$meta_key] = [
            'type'              => 'string',
            'description'       => __('URL social editorial do autor.', 'wordpress-template-news-blocks'),
            'single'            => true,
            'default'           => '',
            'sanitize_callback' => 'esc_url_raw',
            'show_in_rest'      => false,
        ];
    }

    foreach ($meta_definitions as $meta_key => $args) {
        register_meta('user', $meta_key, $args);
    }
}

/**
 * Returns whether the author is editorially verified.
 */
function wtn_is_author_verified(int $author_id): bool
{
    return '1' === (string) get_user_meta($author_id, WTN_AUTHOR_META_VERIFIED, true);
}

/**
 * Returns the accessible editorial photo attachment ID for an author.
 */
function wtn_get_author_photo_id(int $author_id): int
{
    $photo_id = absint(get_user_meta($author_id, WTN_AUTHOR_META_PHOTO_ID, true));

    if (! wtn_blocks_is_accessible_image_attachment($photo_id)) {
        return 0;
    }

    return $photo_id;
}

/**
 * Returns the author's editorial mini bio.
 */
function wtn_get_author_mini_bio(int $author_id): string
{
    return trim((string) get_user_meta($author_id, WTN_AUTHOR_META_MINI_BIO, true));
}

/**
 * Returns the author's short editorial role label.
 */
function wtn_get_author_editorial_role_label(int $author_id): string
{
    return trim(
        (string) get_user_meta(
            $author_id,
            WTN_AUTHOR_META_EDITORIAL_ROLE,
            true
        )
    );
}

<?php

/**
 * Featured Authors block render.
 *
 * @package WordPress_Template_News_Blocks
 */

if (! defined('ABSPATH')) {
    exit;
}

$block_attributes = wp_parse_args(
    $attributes ?? [],
    [
        'authorIds'     => [0, 0, 0, 0, 0],
        'authorCount'   => 5,
        'titleOverride' => '',
        'showViewAll'   => false,
        'viewAllUrl'    => '',
    ]
);

$author_count = absint($block_attributes['authorCount']);

$author_count = in_array($author_count, [3, 4, 5], true)
    ? $author_count
    : 5;

$author_ids = is_array($block_attributes['authorIds'])
    ? $block_attributes['authorIds']
    : [];

$author_ids = array_slice(
    $author_ids,
    0,
    $author_count
);

$normalized_author_ids = [];

foreach ($author_ids as $author_id) {
    $author_id = absint($author_id);

    if (
        0 === $author_id
        || in_array($author_id, $normalized_author_ids, true)
    ) {
        continue;
    }

    $normalized_author_ids[] = $author_id;
}

if (empty($normalized_author_ids)) {
    return;
}

$title_override = trim(
    wp_strip_all_tags(
        is_string($block_attributes['titleOverride'])
            ? $block_attributes['titleOverride']
            : ''
    )
);

$section_title = '' !== $title_override
    ? $title_override
    : __(
        'Nossos principais autores',
        'wordpress-template-news-blocks'
    );

$show_view_all = (bool) $block_attributes['showViewAll'];
$view_all_url  = '';

if (
    $show_view_all
    && is_string($block_attributes['viewAllUrl'])
) {
    $view_all_url = esc_url_raw(
        trim($block_attributes['viewAllUrl'])
    );
}

/**
 * Returns initials for an author display name.
 *
 * @param string $display_name Author display name.
 * @return string
 */
$get_author_initials = static function (string $display_name): string {
    $words = preg_split(
        '/\s+/u',
        trim($display_name),
        -1,
        PREG_SPLIT_NO_EMPTY
    );

    if (empty($words)) {
        return '';
    }

    $words    = array_slice($words, 0, 2);
    $initials = '';

    foreach ($words as $word) {
        $initials .= function_exists('mb_substr')
            ? mb_substr($word, 0, 1)
            : substr($word, 0, 1);
    }

    return function_exists('mb_strtoupper')
        ? mb_strtoupper($initials)
        : strtoupper($initials);
};

/**
 * Builds render data for one configured author.
 *
 * @param int $author_id Author user ID.
 * @return array<string, mixed>|null
 */
$get_author_render_data = static function (int $author_id) use ($get_author_initials): ?array {
    $author_id = absint($author_id);

    if (0 === $author_id) {
        return null;
    }

    $author = get_userdata($author_id);

    if (! $author instanceof WP_User) {
        return null;
    }

    $display_name = trim(
        wp_strip_all_tags(
            (string) $author->display_name
        )
    );

    if (
        '' === $display_name
        || ! user_can($author, 'edit_posts')
    ) {
        return null;
    }

    $published_post_count = function_exists('wtn_get_author_published_posts_count')
        ? (int) wtn_get_author_published_posts_count($author_id)
        : (int) count_user_posts($author_id, 'post', true);

    if ($published_post_count < 1) {
        return null;
    }

    $archive_url = get_author_posts_url(
        $author_id,
        $author->user_nicename
    );

    if (! is_string($archive_url) || '' === $archive_url) {
        return null;
    }

    $editorial_role = function_exists('wtn_get_author_editorial_role_label')
        ? wtn_get_author_editorial_role_label($author_id)
        : get_user_meta(
            $author_id,
            'wtn_author_editorial_role',
            true
        );

    $editorial_role = trim(
        wp_strip_all_tags(
            is_string($editorial_role)
                ? $editorial_role
                : ''
        )
    );

    $avatar_image_size = function_exists('has_image_size')
        && has_image_size('wtn-avatar')
        ? 'wtn-avatar'
        : 'thumbnail';

    $avatar_html = function_exists('wtn_get_author_photo_html')
        ? wtn_get_author_photo_html(
            $author_id,
            $avatar_image_size,
            [
                'class'    => 'wtn-blocks-featured-authors__avatar-image',
                'loading'  => 'lazy',
                'decoding' => 'async',
                'alt'      => '',
            ]
        )
        : '';

    if ('' === $avatar_html) {
        $native_avatar = get_avatar(
            $author_id,
            112,
            '',
            '',
            [
                'class'    => 'wtn-blocks-featured-authors__avatar-image',
                'loading'  => 'lazy',
                'decoding' => 'async',
            ]
        );

        if (is_string($native_avatar)) {
            $avatar_html = $native_avatar;
        }
    }

    $post_count_label = sprintf(
        /* translators: %d: number of published posts by the author. */
        _n(
            '%d matéria',
            '%d matérias',
            $published_post_count,
            'wordpress-template-news-blocks'
        ),
        $published_post_count
    );

    return [
        'id'               => $author_id,
        'archive_url'      => $archive_url,
        'display_name'     => $display_name,
        'editorial_role'   => $editorial_role,
        'avatar_html'      => $avatar_html,
        'initials'         => $get_author_initials($display_name),
        'post_count_label' => $post_count_label,
    ];
};

$resolved_authors = [];

foreach ($normalized_author_ids as $author_id) {
    $author_data = $get_author_render_data($author_id);

    if (null === $author_data) {
        continue;
    }

    $resolved_authors[] = $author_data;
}

if (empty($resolved_authors)) {
    return;
}

$section_heading_tag = function_exists('wtn_blocks_get_next_editorial_heading_tag')
    ? wtn_blocks_get_next_editorial_heading_tag()
    : 'h2';

$section_heading_tag = function_exists('wtn_blocks_sanitize_heading_tag')
    ? wtn_blocks_sanitize_heading_tag($section_heading_tag)
    : $section_heading_tag;

$section_heading_tag = tag_escape($section_heading_tag);

$wrapper_attributes = get_block_wrapper_attributes(
    [
        'class' => implode(
            ' ',
            [
                'wtn-blocks-featured-authors',
                'wtn-blocks-featured-authors--count-' . $author_count,
            ]
        ),
    ]
);
?>

<section <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            ?>>
    <header class="wtn-blocks-featured-authors__header">
        <<?php echo esc_html($section_heading_tag); ?> class="wtn-blocks-featured-authors__section-title">
            <?php echo esc_html($section_title); ?>
        </<?php echo esc_html($section_heading_tag); ?>>

        <?php if ('' !== $view_all_url) : ?>
            <a
                class="wtn-blocks-featured-authors__view-all"
                href="<?php echo esc_url($view_all_url); ?>">
                <?php
                esc_html_e(
                    'Ver todas',
                    'wordpress-template-news-blocks'
                );
                ?>
            </a>
        <?php endif; ?>
    </header>

    <ul class="wtn-blocks-featured-authors__items">
        <?php foreach ($resolved_authors as $author_data) : ?>
            <li class="wtn-blocks-featured-authors__item">
                <a
                    class="wtn-blocks-featured-authors__author-card"
                    href="<?php echo esc_url($author_data['archive_url']); ?>">
                    <span
                        class="wtn-blocks-featured-authors__avatar"
                        aria-hidden="true">
                        <?php if ('' !== $author_data['avatar_html']) : ?>
                            <?php echo wp_kses_post($author_data['avatar_html']); ?>
                        <?php else : ?>
                            <span class="wtn-blocks-featured-authors__avatar-fallback">
                                <?php echo esc_html($author_data['initials']); ?>
                            </span>
                        <?php endif; ?>
                    </span>

                    <span class="wtn-blocks-featured-authors__content">
                        <span class="wtn-blocks-featured-authors__name">
                            <?php echo esc_html($author_data['display_name']); ?>
                        </span>

                        <?php if ('' !== $author_data['editorial_role']) : ?>
                            <span class="wtn-blocks-featured-authors__role">
                                <?php echo esc_html($author_data['editorial_role']); ?>
                            </span>
                        <?php endif; ?>

                        <span class="wtn-blocks-featured-authors__post-count">
                            <?php echo esc_html($author_data['post_count_label']); ?>
                        </span>
                    </span>
                </a>
            </li>
        <?php endforeach; ?>
    </ul>
</section>
